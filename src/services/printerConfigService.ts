import { supabase } from '../integrations/supabase/client';
import { PrinterConfig, PrinterType } from '../utils/printer/types';
import { toast } from 'sonner';

const PRINTER_CONFIG_TABLE = 'printer_configs';

// Mapeamento de tipos para prefixos no display_name
const TYPE_PREFIXES = {
  [PrinterType.COUNTER]: 'Balcão',
  [PrinterType.KITCHEN]: 'Cozinha',
  [PrinterType.BAR]: 'Bar',
  [PrinterType.OTHER]: 'Outro'
};

/**
 * Obtém todas as configurações de impressoras para um restaurante
 * @param restaurantId ID do restaurante
 * @returns Promise com array de configurações de impressoras
 */
export const getAllPrinterConfigs = async (restaurantId: string): Promise<PrinterConfig[]> => {
  try {
    const { data, error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as PrinterConfig[];
  } catch (error) {
    console.error('Erro ao obter configurações de impressoras:', error);
    toast.error('Não foi possível carregar as configurações de impressoras');
    return [];
  }
};

/**
 * Obtém uma configuração de impressora pelo ID
 * @param id ID da configuração de impressora
 * @returns Promise com a configuração de impressora
 */
export const getPrinterConfigById = async (id: string): Promise<PrinterConfig | null> => {
  try {
    const { data, error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PrinterConfig;
  } catch (error) {
    console.error(`Erro ao obter configuração de impressora ${id}:`, error);
    return null;
  }
};

/**
 * Obtém uma configuração de impressora pelo tipo
 * @param type Tipo da impressora (counter, kitchen, bar, other)
 * @param restaurantId ID do restaurante
 * @returns Promise com a configuração de impressora
 */
export const getPrinterConfigByType = async (
  type: PrinterType, 
  restaurantId: string
): Promise<PrinterConfig | null> => {
  try {
    // Buscar impressoras cujo display_name começa com o prefixo do tipo
    const prefix = TYPE_PREFIXES[type];
    
    const { data, error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .select('*')
      .eq('restaurant_id', restaurantId)
      .ilike('display_name', `${prefix}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    // Se não encontrou nenhuma impressora com esse tipo, retorna null
    if (!data) return null;
    
    // Adiciona o tipo à configuração retornada para compatibilidade com a interface
    const printerConfig = data as PrinterConfig;
    printerConfig.type = type;
    
    return printerConfig;
  } catch (error) {
    console.error(`Erro ao obter configuração de impressora do tipo ${type}:`, error);
    return null;
  }
};

/**
 * Cria uma nova configuração de impressora
 * @param config Dados da configuração de impressora
 * @returns Promise com a configuração de impressora criada
 */
export const createPrinterConfig = async (config: PrinterConfig): Promise<PrinterConfig | null> => {
  try {
    // Verificar se o restaurant_id está presente
    if (!config.restaurant_id) {
      throw new Error('restaurant_id é obrigatório para criar uma configuração de impressora');
    }
    
    // Se o tipo foi fornecido, garantir que o display_name comece com o prefixo correto
    if (config.type && !config.display_name.startsWith(TYPE_PREFIXES[config.type])) {
      config.display_name = `${TYPE_PREFIXES[config.type]} - ${config.display_name}`;
    }
    
    // Remover campos que não existem na tabela antes de inserir
    const { type, isDefault, ...dbConfig } = config;
    
    // Verificar se já existe uma impressora com o mesmo tipo (baseado no prefixo do display_name)
    let existingConfig = null;
    if (config.type) {
      existingConfig = await getPrinterConfigByType(config.type, config.restaurant_id);
    }
    
    if (existingConfig) {
      // Se já existe, atualiza em vez de criar
      return updatePrinterConfig(existingConfig.id!, config);
    }
    
    const { data, error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .insert(dbConfig)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar configuração de impressora:', error);
      throw error;
    }
    
    // Adiciona o tipo à configuração retornada para compatibilidade com a interface
    const printerConfig = data as PrinterConfig;
    if (config.type) {
      printerConfig.type = config.type;
    }
    
    toast.success(`Impressora ${config.display_name} configurada com sucesso!`);
    return printerConfig;
  } catch (error) {
    console.error('Erro ao criar configuração de impressora:', error);
    toast.error('Não foi possível salvar a configuração da impressora');
    return null;
  }
};

/**
 * Atualiza uma configuração de impressora existente
 * @param id ID da configuração de impressora
 * @param config Novos dados da configuração
 * @returns Promise com a configuração atualizada
 */
export const updatePrinterConfig = async (id: string, config: Partial<PrinterConfig>): Promise<PrinterConfig | null> => {
  try {
    // Se o tipo foi fornecido, garantir que o display_name comece com o prefixo correto
    if (config.type && config.display_name && !config.display_name.startsWith(TYPE_PREFIXES[config.type])) {
      config.display_name = `${TYPE_PREFIXES[config.type]} - ${config.display_name}`;
    }
    
    // Remover campos que não existem na tabela antes de atualizar
    const { type, isDefault, ...dbConfig } = config;
    
    const { data, error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .update(dbConfig)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Adiciona o tipo à configuração retornada para compatibilidade com a interface
    const printerConfig = data as PrinterConfig;
    if (config.type) {
      printerConfig.type = config.type;
    }
    
    toast.success(`Configuração da impressora atualizada com sucesso!`);
    return printerConfig;
  } catch (error) {
    console.error(`Erro ao atualizar configuração de impressora ${id}:`, error);
    toast.error('Não foi possível atualizar a configuração da impressora');
    return null;
  }
};

/**
 * Remove uma configuração de impressora
 * @param id ID da configuração de impressora
 * @returns Promise com status da operação
 */
export const deletePrinterConfig = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(PRINTER_CONFIG_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success('Configuração da impressora removida com sucesso!');
    return true;
  } catch (error) {
    console.error(`Erro ao remover configuração de impressora ${id}:`, error);
    toast.error('Não foi possível remover a configuração da impressora');
    return false;
  }
};

/**
 * Obtém a impressora padrão para um determinado tipo
 * @param type Tipo da impressora
 * @param restaurantId ID do restaurante
 * @returns Promise com a configuração da impressora padrão
 */
export const getDefaultPrinterForType = async (
  type: PrinterType,
  restaurantId: string
): Promise<PrinterConfig | null> => {
  try {
    // Buscar impressora pelo tipo (baseado no prefixo do display_name)
    return getPrinterConfigByType(type, restaurantId);
  } catch (error) {
    console.error(`Erro ao obter impressora padrão para o tipo ${type}:`, error);
    return null;
  }
};
