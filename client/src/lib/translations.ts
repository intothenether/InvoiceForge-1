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
  
  // PDF Stamper
  pdfStamper: string;
  stampPdf: string;
  uploadInvoicePdf: string;
  paymentDetails: string;
  paymentDate: string;
  paymentMethod: string;
  paymentMethodOptional: string;
  paymentReference: string;
  paymentReferenceOptional: string;
  addPaymentStamp: string;
  pdfPreview: string;
  uploadPdfToPreview: string;
  dropPdfHere: string;
  onlyPdfAccepted: string;
  clickToSelectDifferentFile: string;
  invalidFile: string;
  selectPdfFile: string;
  dropPdfFile: string;
  noFileSelected: string;
  selectPdfFirst: string;
  success: string;
  paymentStampAdded: string;
  processingFailed: string;
  failedToAddStamp: string;
  processing: string;
  addPaymentStampExport: string;
  createInvoice: string;
  addPaymentStampsExisting: string;
  // Payment Methods
  bankTransfer: string;
  creditCard: string;
  cash: string;
  check: string;
  other: string;
  selectPaymentMethod: string;
  transactionIdPlaceholder: string;
  
  // PDF Stamp Content
  paid: string;
  dateLabel: string;
  methodLabel: string;
  refLabel: string;
  stampedInvoice: string;
  hereIsStampedInvoice: string;
  shareStampedInvoice: string;
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
    swedish: "Swedish",
    
    // PDF Stamper
    pdfStamper: "PDF Payment Stamper",
    stampPdf: "Stamp PDF",
    uploadInvoicePdf: "Upload Invoice PDF",
    paymentDetails: "Payment Details",
    paymentDate: "Payment Date",
    paymentMethod: "Payment Method",
    paymentMethodOptional: "Payment Method (Optional)",
    paymentReference: "Payment Reference",
    paymentReferenceOptional: "Payment Reference (Optional)",
    addPaymentStamp: "Add Payment Stamp",
    pdfPreview: "PDF Preview",
    uploadPdfToPreview: "Upload a PDF to see preview",
    dropPdfHere: "Drop PDF file here or click to browse",
    onlyPdfAccepted: "Only PDF files are accepted",
    clickToSelectDifferentFile: "Click to select a different file",
    invalidFile: "Invalid File",
    selectPdfFile: "Please select a PDF file.",
    dropPdfFile: "Please drop a PDF file.",
    noFileSelected: "No File Selected",
    selectPdfFirst: "Please select a PDF file first.",
    success: "Success!",
    paymentStampAdded: "Payment stamp added successfully. The stamped PDF has been saved and shared.",
    processingFailed: "Processing Failed",
    failedToAddStamp: "Failed to add payment stamp to PDF.",
    processing: "Processing...",
    addPaymentStampExport: "Add Payment Stamp & Export",
    createInvoice: "Create Invoice",
    addPaymentStampsExisting: "Add payment stamps to existing invoices",
    // Payment Methods
    bankTransfer: "Bank Transfer",
    creditCard: "Credit Card",
    cash: "Cash",
    check: "Check",
    other: "Other",
    selectPaymentMethod: "Select payment method",
    transactionIdPlaceholder: "e.g., Transaction ID, Check number",
    
    // PDF Stamp Content
    paid: "PAID",
    dateLabel: "Date:",
    methodLabel: "Method:",
    refLabel: "Ref:",
    stampedInvoice: "Stamped Invoice",
    hereIsStampedInvoice: "Here is your stamped invoice",
    shareStampedInvoice: "Share Stamped Invoice"
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
    swedish: "Svenska",
    
    // PDF Stamper
    pdfStamper: "PDF Betalningsstämpel",
    stampPdf: "Stämpla PDF",
    uploadInvoicePdf: "Ladda upp faktura PDF",
    paymentDetails: "Betalningsdetaljer",
    paymentDate: "Betalningsdatum",
    paymentMethod: "Betalningsmetod",
    paymentMethodOptional: "Betalningsmetod (Valfritt)",
    paymentReference: "Betalningsreferens",
    paymentReferenceOptional: "Betalningsreferens (Valfritt)",
    addPaymentStamp: "Lägg till betalningsstämpel",
    pdfPreview: "PDF Förhandsgranskning",
    uploadPdfToPreview: "Ladda upp en PDF för att se förhandsgranskning",
    dropPdfHere: "Släpp PDF-fil här eller klicka för att bläddra",
    onlyPdfAccepted: "Endast PDF-filer accepteras",
    clickToSelectDifferentFile: "Klicka för att välja en annan fil",
    invalidFile: "Ogiltig fil",
    selectPdfFile: "Vänligen välj en PDF-fil.",
    dropPdfFile: "Vänligen släpp en PDF-fil.",
    noFileSelected: "Ingen fil vald",
    selectPdfFirst: "Vänligen välj en PDF-fil först.",
    success: "Framgång!",
    paymentStampAdded: "Betalningsstämpel tillagd framgångsrikt. Den stämplade PDF:en har sparats och delats.",
    processingFailed: "Bearbetning misslyckades",
    failedToAddStamp: "Misslyckades med att lägga till betalningsstämpel på PDF.",
    processing: "Bearbetar...",
    addPaymentStampExport: "Lägg till betalningsstämpel & exportera",
    createInvoice: "Skapa faktura",
    addPaymentStampsExisting: "Lägg till betalningsstämplar på befintliga fakturor",
    // Payment Methods
    bankTransfer: "Banköverföring",
    creditCard: "Kreditkort",
    cash: "Kontanter",
    check: "Check",
    other: "Annat",
    selectPaymentMethod: "Välj betalningsmetod",
    transactionIdPlaceholder: "t.ex. Transaktions-ID, Checknummer",
    
    // PDF Stamp Content
    paid: "BETALD",
    dateLabel: "Datum:",
    methodLabel: "Metod:",
    refLabel: "Ref:",
    stampedInvoice: "Stämplad Faktura",
    hereIsStampedInvoice: "Här är din stämplade faktura",
    shareStampedInvoice: "Dela Stämplad Faktura"
  }
};