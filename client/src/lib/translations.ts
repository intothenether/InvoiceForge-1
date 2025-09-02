export type Language = 'en' | 'sv';

export interface Translations {
  // Header
  appTitle: string;
  appSubtitle: string;
  
  // Form
  invoiceDetails: string;
  fillServiceInfo: string;
  clientInformation: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  services: string;
  addService: string;
  serviceName: string;
  hours: string;
  rate: string;
  total: string;
  
  // Actions
  previewInvoice: string;
  downloadPDF: string;
  
  // Preview
  invoicePreview: string;
  livePreview: string;
  invoice: string;
  date: string;
  billTo: string;
  from: string;
  businessName: string;
  businessEmail: string;
  service: string;
  subtotal: string;
  tax: string;
  paymentTerms: string;
  paymentTermsText: string;
  readyToGenerate: string;
  incompleteForm: string;
  allFieldsCompleted: string;
  pleaseFillFields: string;
  
  // Toast messages
  previewUpdated: string;
  previewUpdatedDesc: string;
  validationError: string;
  fillRequiredFields: string;
  pdfGenerated: string;
  downloadSuccessful: string;
  downloadFailed: string;
  downloadError: string;
  
  // Footer
  copyright: string;
  tagline: string;
  
  // Language
  language: string;
  english: string;
  swedish: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: "Invoice Generator Pro",
    appSubtitle: "Professional Invoice Creation",
    
    invoiceDetails: "Invoice Details",
    fillServiceInfo: "Fill in service information",
    clientInformation: "Client Information",
    clientName: "Client Name",
    clientEmail: "Client Email",
    invoiceNumber: "Invoice Number",
    services: "Services",
    addService: "Add Service",
    serviceName: "Service Name",
    hours: "Hours",
    rate: "Rate ($)",
    total: "Total",
    
    previewInvoice: "Preview Invoice",
    downloadPDF: "Download PDF",
    
    invoicePreview: "Invoice Preview",
    livePreview: "Live preview of your invoice",
    invoice: "INVOICE",
    date: "Date",
    billTo: "Bill To:",
    from: "From:",
    businessName: "Your Business Name",
    businessEmail: "your.email@business.com",
    service: "Service",
    subtotal: "Subtotal:",
    tax: "Tax",
    paymentTerms: "Payment Terms",
    paymentTermsText: "Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.",
    readyToGenerate: "Ready to Generate",
    incompleteForm: "Incomplete Form",
    allFieldsCompleted: "All fields completed",
    pleaseFillFields: "Please fill required fields",
    
    previewUpdated: "Preview Updated",
    previewUpdatedDesc: "Invoice preview has been updated with your changes.",
    validationError: "Validation Error",
    fillRequiredFields: "Please fill in all required fields before previewing.",
    pdfGenerated: "PDF Generated",
    downloadSuccessful: "Your invoice has been downloaded successfully.",
    downloadFailed: "Download Failed",
    downloadError: "There was an error generating the PDF. Please try again.",
    
    copyright: "© 2024 Invoice Generator Pro",
    tagline: "Professional invoice creation made simple",
    
    language: "Language",
    english: "English",
    swedish: "Swedish"
  },
  
  sv: {
    appTitle: "Faktura Generator Pro",
    appSubtitle: "Professionell Fakturaframställning",
    
    invoiceDetails: "Fakturadetaljer",
    fillServiceInfo: "Fyll i tjänstinformation",
    clientInformation: "Kundinformation",
    clientName: "Kundnamn",
    clientEmail: "Kundens E-post",
    invoiceNumber: "Fakturanummer",
    services: "Tjänster",
    addService: "Lägg till tjänst",
    serviceName: "Tjänstens namn",
    hours: "Timmar",
    rate: "Timpris (kr)",
    total: "Totalt",
    
    previewInvoice: "Förhandsgranska faktura",
    downloadPDF: "Ladda ner PDF",
    
    invoicePreview: "Förhandsgranskning av faktura",
    livePreview: "Live förhandsgranskning av din faktura",
    invoice: "FAKTURA",
    date: "Datum",
    billTo: "Faktureras till:",
    from: "Från:",
    businessName: "Ditt företagsnamn",
    businessEmail: "din.epost@foretag.se",
    service: "Tjänst",
    subtotal: "Delsumma:",
    tax: "Moms",
    paymentTerms: "Betalningsvillkor",
    paymentTermsText: "Betalning ska ske inom 30 dagar från fakturadatum. Försenad betalning kan medföra 1,5% månatlig serviceavgift.",
    readyToGenerate: "Redo att generera",
    incompleteForm: "Ofullständig blankett",
    allFieldsCompleted: "Alla fält ifyllda",
    pleaseFillFields: "Vänligen fyll i obligatoriska fält",
    
    previewUpdated: "Förhandsgranskning uppdaterad",
    previewUpdatedDesc: "Förhandsvisningen av fakturan har uppdaterats med dina ändringar.",
    validationError: "Valideringsfel",
    fillRequiredFields: "Vänligen fyll i alla obligatoriska fält innan förhandsgranskning.",
    pdfGenerated: "PDF skapad",
    downloadSuccessful: "Din faktura har laddats ner framgångsrikt.",
    downloadFailed: "Nedladdning misslyckades",
    downloadError: "Ett fel uppstod när PDF:en skulle skapas. Vänligen försök igen.",
    
    copyright: "© 2024 Faktura Generator Pro",
    tagline: "Professionell fakturaframställning gjord enkelt",
    
    language: "Språk",
    english: "Engelska",
    swedish: "Svenska"
  }
};