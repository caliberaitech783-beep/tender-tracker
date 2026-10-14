// Column order and labels from the user's new tender format.xlsx.
export const REGISTRATION_COLUMNS=[
 ['tenderId','Tender ID'],['clientRef','Client Tender Ref. No.'],
 ['title','Tender Title / Description'],['client','Client / Issuing Authority'],
 ['tenderType','Tender Type'],['publishDate','Tender Publish Date'],['publishTime','Time'],
 ['deadline','Bid Submission Deadline'],['submissionTime','Time'],['validityDays','Bid Validity'],
 ['meetingDate','Pre-Bid Date'],['queryDeadline','Pre-Bid Query Deadline'],['visitDate','Site Visit Date'],
 ['technicalOpening','Bid Opening Date'],['estimatedValue','Estimated Contract Value'],
 ['durationMonths','Contract Duration'],['documentFee','Tender Document Fee (Not mandatory for every tenders)'],
 ['emdAmount','EMD / Bid Security Amount'],['performanceSecurity','Performance Security (%)'],
 ['owner','Bid Manager/Owner'],['goDecision','Go No Go decision'],['pipelineStatus','Pipeline Status'],
 ['location','Location'],['portalUrl','Portal URL'],['turnoverRequired','Average Turnover'],
 ['workingCapital','Working Capital'],['netWorthRequired','Min. Net Worth Required'],
 ['experienceRequired','Similar Work Experience Required'],['jvAllowed','JV / Consortium Allowed'],
 ['corrigendum','Corrigendum']
];
export const REGISTRATION_SECTIONS=[
 ['Basic details',REGISTRATION_COLUMNS.slice(0,5).map(([key])=>key)],
 ['Dates & deadlines',REGISTRATION_COLUMNS.slice(5,14).map(([key])=>key)],
 ['Value & financial terms',REGISTRATION_COLUMNS.slice(14,19).map(([key])=>key)],
 ['Ownership, decision & location',REGISTRATION_COLUMNS.slice(19,24).map(([key])=>key)],
 ['Eligibility & corrigendum',REGISTRATION_COLUMNS.slice(24).map(([key])=>key)]
];
export const OPTIONAL_REGISTRATION_FIELDS=['documentFee','turnoverRequired','netWorthRequired','experienceRequired'];
export const REGISTRATION_KEYS=REGISTRATION_COLUMNS.map(([key])=>key);
export function registrationRequired(){return [];}
export function registrationField(field,current={}){
 const label=REGISTRATION_COLUMNS.find(([key])=>key===field.key)?.[1]||field.label;
 return {...field,label,required:false,...(field.key==='tenderType'?{allowedValues:[...new Set(['OB','Logistics','MDO',current.tenderType].filter(Boolean))]}:{}),...(OPTIONAL_REGISTRATION_FIELDS.includes(field.key)?{help:'Optional — not mandatory for every tender.'}:{}),...(field.key==='publishTime'?{help:'Tender publish time.'}:field.key==='submissionTime'?{help:'Bid submission closing time.'}:{} )};
}
