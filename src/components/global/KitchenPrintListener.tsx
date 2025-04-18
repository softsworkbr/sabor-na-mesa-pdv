import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/use-desktop";
import { checkPrinterServerStatus } from "@/services/printerServerService";
import axios from "axios";
import { generatePrintText } from "@/utils/restaurant/printHelpers";
import type { Order, OrderStatus, OrderItem } from "@/utils/restaurant/orderTypes";

/**
 * Componente global para impressão automática de pedidos na cozinha.
 * Só imprime se o pedido estiver com status 'impress' e apenas itens não impressos.
 * Após imprimir, atualiza o campo printed_at dos itens.
 * Só ativa se o usuário estiver autenticado e estiver em um dispositivo Desktop.
 */
export const KitchenPrintListener = () => {
  const { user, loading } = useAuth();
  const isDesktop = useIsDesktop();
  const [serverOnline, setServerOnline] = useState<boolean>(false);

  useEffect(() => {
    console.log("[KitchenPrintListener] useEffect", { user, loading });
    if (!user || loading || isDesktop === false) return;

    // Checa status do servidor de impressão antes de criar o canal
    let channel: any;
    let cancelled = false;
    (async () => {
      const online = await checkPrinterServerStatus();
      setServerOnline(online);
      if (!online) {
        console.warn("[KitchenPrintListener] Servidor de impressão offline, listener não será ativado.");
        return;
      }
      if (cancelled) return;
      channel = supabase
        .channel("orders-print-kitchen")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: "status=eq.impress" },
          async (payload) => {
            console.log("[KitchenPrintListener] Evento recebido do Supabase", payload);
            const newOrder = payload.new as any;
            if (!newOrder || typeof newOrder.status !== "string") {
              console.warn("[KitchenPrintListener] Payload sem status", payload);
              return;
            }
            // Cast status para OrderStatus e garanta todos os campos obrigatórios
            const order = { ...newOrder, status: newOrder.status as OrderStatus } as Order;
            if (order.status === "impress") {
              console.log("[KitchenPrintListener] Pedido elegível para impressão", order);
              console.log("[KitchenPrintListener] Parâmetros da consulta de itens:", {
                order_id: String(order.id),
                printed_at: null
              });
              const { data: items, error } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", String(order.id))
                .is("printed_at", null);

              console.log("[KitchenPrintListener] Resultado do select de itens:", { items, error });

              // Atualizar status da ordem para 'active' imediatamente, mesmo se não houver itens para imprimir
              const { data: updatedOrder, error: updateError } = await supabase
                .from('orders')
                .update({ status: 'active' })
                .eq('id', order.id)
                .select()
                .single();
              if (updateError) {
                console.error('[KitchenPrintListener] Erro ao atualizar status da ordem para active:', updateError);
              } else {
                console.log('[KitchenPrintListener] Status da ordem atualizado para active:', updatedOrder);
              }

              if (error || !items?.length) {
                console.warn("[KitchenPrintListener] Nenhum item para imprimir ou erro", { error, items });
                return;
              }

              // Converta extras para ProductExtra[] se necessário
              const typedItems: OrderItem[] = items.map((item: any) => ({
                ...item,
                extras: Array.isArray(item.extras) ? item.extras : [],
              }));

              // Buscar dados da mesa (table) para impressão
              let tableData = undefined;
              if (order.table_id) {
                const { data: table, error: tableError } = await supabase
                  .from('tables')
                  .select('id, number, status, description')
                  .eq('id', order.table_id)
                  .maybeSingle();
                if (tableError) {
                  console.error('[KitchenPrintListener] Erro ao buscar dados da mesa:', tableError);
                } else {
                  tableData = table;
                }
              }

              const printText = generatePrintText(order, typedItems, tableData);
              console.log("[KitchenPrintListener] Texto gerado para impressão", printText);

              // --- Envio de impressão estilo TableOrderDrawer (bold, escuro) ---
              // Buscar config da impressora pelo tipo (kitchen)
              const { data: printerConfig, error: printerError } = await supabase
                .from('printer_configs')
                .select('*')
                .ilike('display_name', 'Cozinha%')
                .limit(1)
                .maybeSingle();

              if (printerError || !printerConfig) {
                console.error(`[KitchenPrintListener] Erro ao buscar config da impressora de cozinha:`, printerError);
                return;
              }

              if (!printerConfig.ip_address) {
                console.error(`[KitchenPrintListener] Impressora de cozinha sem IP configurado`);
                return;
              }

              const endpoint = printerConfig.endpoint || '/print';
              const url = `https://${printerConfig.ip_address}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

              try {
                const response = await axios.post(url, {
                  printerName: printerConfig.windows_printer_name,
                  text: printText,
                  options: {
                    align: "left",
                    font: "A",
                    doubleSize: false,
                    bold: true,
                    beep: true
                  }
                });
                console.log(`[KitchenPrintListener] Impressão enviada com sucesso:`, response.data);
              } catch (printError) {
                console.error(`[KitchenPrintListener] Erro ao imprimir na cozinha:`, printError);
                return;
              }

              const now = new Date().toISOString();
              const itemIds = typedItems.map((item) => String(item.id));
              await supabase
                .from("order_items")
                .update({ printed_at: now })
                .in("id", itemIds);
              console.log("[KitchenPrintListener] printed_at atualizado para itens", itemIds);
            } else {
              console.log("[KitchenPrintListener] Pedido recebido mas status não é 'impress'", order.status);
            }
          }
        )
        .subscribe();
    })();
    return () => {
      cancelled = true;
      if (channel) {
        channel.unsubscribe();
        console.log("[KitchenPrintListener] Unsubscribed do canal Supabase");
      }
    };
  }, [user, loading, isDesktop]);

  return null;
};
