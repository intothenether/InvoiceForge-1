export interface BusinessConfig {
  businessName: string;
  businessEmail: string;
  businessMomsregnr: string;
  businessPhone: string;
  businessPlusgiro: string;
  invoiceSavePath?: string;
  stampedInvoiceSavePath?: string;
  useAutoInvoiceNumber?: boolean;
}

export const defaultBusinessConfig: BusinessConfig = {
  businessName: "Facio AB",
  businessEmail: "info@facio.se",
  businessMomsregnr: "SE556789012301",
  businessPhone: "+46 8 123 456 78",
  businessPlusgiro: "123456-7",
  invoiceSavePath: "",
  stampedInvoiceSavePath: "",
  useAutoInvoiceNumber: false
};

// For client-side storage
export const getBusinessConfig = (): BusinessConfig => {
  if (typeof window === 'undefined') {
    return defaultBusinessConfig;
  }

  const stored = localStorage.getItem('businessConfig');
  if (stored) {
    try {
      return { ...defaultBusinessConfig, ...JSON.parse(stored) };
    } catch (error) {
      console.warn('Failed to parse stored business config:', error);
    }
  }

  return defaultBusinessConfig;
};

export const saveBusinessConfig = (config: BusinessConfig): void => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem('businessConfig', JSON.stringify(config));
};
