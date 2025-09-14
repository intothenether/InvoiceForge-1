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
  clientPersonnumber: string;
  clientAddress: string;
  comment: string;
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
  businessMomsregnr: string;
  businessPhone: string;
  businessPlusgiro: string;
  service: string;
  skatterabatt: string;
  subtotal: string;
  tax: string;
  paymentTerms: string;
  paymentTermsText: string;
  readyToGenerate: string;
  incompleteForm: string;
  allFieldsCompleted: string;
  pleaseFillFields: string;
  pleaseFillRequiredFields: string;
  
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
  
  // Service Types
  serviceType: string;
  hourlyService: string;
  fixedService: string;
  fixedTotal: string;
  taxRateLabel: string;
  
  // Client Selection
  clientSelection: string;
  selectExistingClient: string;
  searchClients: string;
  noClientsFound: string;
  addNewClient: string;
  hideDeleteButtons: string;
  showDeleteButtons: string;
  
  // Language
  language: string;
  english: string;
  swedish: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: "Facio",
    appSubtitle: "Invoice Creation",
    
    invoiceDetails: "Invoice Details",
    fillServiceInfo: "Fill in service information",
    clientInformation: "Client Information",
    clientName: "Client Name",
    clientEmail: "Client Email",
    clientPersonnumber: "Client Personnr.",
    clientAddress: "Client Address",
    comment: "Details",
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
    businessName: "Reginastads",
    businessEmail: "reginasfirma@gmail.com",
    businessMomsregnr: "SE 650907284601",
    businessPhone: "0737705714",
    businessPlusgiro: "509014-7",
    service: "Service",
    skatterabatt: "Skatterabatt",
    subtotal: "Subtotal:",
    tax: "Tax",
    paymentTerms: "Payment Terms",
    paymentTermsText: "Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.",
    readyToGenerate: "Ready to Generate",
    incompleteForm: "Incomplete Form",
    allFieldsCompleted: "All fields completed",
    pleaseFillFields: "Please fill required fields",
    pleaseFillRequiredFields: "Please fill required fields",
    
    previewUpdated: "Preview Updated",
    previewUpdatedDesc: "Invoice preview has been updated with your changes.",
    validationError: "Validation Error",
    fillRequiredFields: "Please fill in all required fields before previewing.",
    pdfGenerated: "PDF Generated",
    downloadSuccessful: "Your invoice has been downloaded successfully.",
    downloadFailed: "Download Failed",
    downloadError: "There was an error generating the PDF. Please try again.",
    
    copyright: "© 2025 Facio",
    tagline: "Invoice creation made simple",
    
    serviceType: "Service Type",
    hourlyService: "Hourly Service",
    fixedService: "Fixed Price Service",
    fixedTotal: "Fixed Total",
    taxRateLabel: "Tax Rate",
    
    clientSelection: "Client Selection",
    selectExistingClient: "Select existing client or enter new",
    searchClients: "Search clients...",
    noClientsFound: "No clients found.",
    addNewClient: "Add new client",
    hideDeleteButtons: "Hide delete buttons",
    showDeleteButtons: "Show delete buttons",
    
    language: "Language",
    english: "English",
    swedish: "Swedish"
  },
  
  sv: {
    appTitle: "Facio",
    appSubtitle: "Fakturaframställning",
    
    invoiceDetails: "Fakturadetaljer",
    fillServiceInfo: "Fyll i tjänstinformation",
    clientInformation: "Kundinformation",
    clientName: "Kundnamn",
    clientEmail: "Kundens E-post",
    clientPersonnumber: "Kundens Personnr.",
    clientAddress: "Kundens Adress",
    comment: "Anmmärkning",
    invoiceNumber: "Fakturanummer",
    services: "Tjänster",
    addService: "Lägg till tjänst",
    serviceName: "Tjänstens namn",
    hours: "Timmar",
    rate: "Timpris (kr)",
    total: "Summa",
    
    previewInvoice: "Förhandsgranska faktura",
    downloadPDF: "Ladda ner PDF",
    
    invoicePreview: "Förhandsgranskning av faktura",
    livePreview: "Live förhandsgranskning av din faktura",
    invoice: "FAKTURA",
    date: "Datum",
    billTo: "Faktureras till:",
    from: "Från:",
    businessName: "Reginastads",
    businessEmail: "reginasfirma@gmail.com",
    businessMomsregnr: "SE 650907284601",
    businessPhone: "0737705714",
    businessPlusgiro: "509014-7",
    service: "Tjänst",
    skatterabatt: "Skatterabatt",
    subtotal: "Delsumma:",
    tax: "Moms",
    paymentTerms: "Betalningsvillkor",
    paymentTermsText: "Betalning ska ske inom 30 dagar från fakturadatum. Försenad betalning kan medföra 1,5% månatlig serviceavgift.",
    readyToGenerate: "Redo att generera",
    incompleteForm: "Ofullständig blankett",
    allFieldsCompleted: "Alla fält ifyllda",
    pleaseFillFields: "Vänligen fyll i obligatoriska fält",
    pleaseFillRequiredFields: "Vänligen fyll i obligatoriska fält",
    
    previewUpdated: "Förhandsgranskning uppdaterad",
    previewUpdatedDesc: "Förhandsvisningen av fakturan har uppdaterats med dina ändringar.",
    validationError: "Valideringsfel",
    fillRequiredFields: "Vänligen fyll i alla obligatoriska fält innan förhandsgranskning.",
    pdfGenerated: "PDF skapad",
    downloadSuccessful: "Din faktura har laddats ned!",
    downloadFailed: "Nedladdningen misslyckades.",
    downloadError: "Ett fel uppstod när PDF:en skulle skapas. Vänligen försök igen.",
    
    copyright: "© 2025 Facio",
    tagline: "Enkel fakturaframställning",
    
    serviceType: "Tjänsttyp",
    hourlyService: "Timtjänst",
    fixedService: "Fast pris tjänst",
    fixedTotal: "Fast totalt",
    taxRateLabel: "Momssats",
    
    clientSelection: "Kundval",
    selectExistingClient: "Välj befintlig kund eller ange ny",
    searchClients: "Sök kunder...",
    noClientsFound: "Inga kunder hittades.",
    addNewClient: "Lägg till ny kund",
    hideDeleteButtons: "Dölj raderingsknapparna",
    showDeleteButtons: "Visa raderingsknapparna",
    
    language: "Språk",
    english: "Engelska",
    swedish: "Svenska"
  }
};