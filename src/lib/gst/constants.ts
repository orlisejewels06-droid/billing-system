import { IndianState } from '../types';

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'JAMMU AND KASHMIR' },
  { code: '02', name: 'HIMACHAL PRADESH' },
  { code: '03', name: 'PUNJAB' },
  { code: '04', name: 'CHANDIGARH' },
  { code: '05', name: 'UTTARAKHAND' },
  { code: '06', name: 'HARYANA' },
  { code: '07', name: 'DELHI' },
  { code: '08', name: 'RAJASTHAN' },
  { code: '09', name: 'UTTAR PRADESH' },
  { code: '10', name: 'BIHAR' },
  { code: '11', name: 'SIKKIM' },
  { code: '12', name: 'ARUNACHAL PRADESH' },
  { code: '13', name: 'NAGALAND' },
  { code: '14', name: 'MANIPUR' },
  { code: '15', name: 'MIZORAM' },
  { code: '16', name: 'TRIPURA' },
  { code: '17', name: 'MEGHALAYA' },
  { code: '18', name: 'ASSAM' },
  { code: '19', name: 'WEST BENGAL' },
  { code: '20', name: 'JHARKHAND' },
  { code: '21', name: 'ODISHA' },
  { code: '22', name: 'CHHATTISGARH' },
  { code: '23', name: 'MADHYA PRADESH' },
  { code: '24', name: 'GUJARAT' },
  { code: '25', name: 'DAMAN AND DIU' },
  { code: '26', name: 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU' },
  { code: '27', name: 'MAHARASHTRA' },
  { code: '29', name: 'KARNATAKA' },
  { code: '30', name: 'GOA' },
  { code: '31', name: 'LAKSHADWEEP' },
  { code: '32', name: 'KERALA' },
  { code: '33', name: 'TAMIL NADU' },
  { code: '34', name: 'PUDUCHERRY' },
  { code: '35', name: 'ANDAMAN AND NICOBAR ISLANDS' },
  { code: '36', name: 'TELANGANA' },
  { code: '37', name: 'ANDHRA PRADESH' },
  { code: '38', name: 'LADAKH' },
  { code: '97', name: 'OTHER TERRITORY' },
];

export const JEWELLERY_HSN_CODES = [
  { code: '71023100', description: 'ROUGH DIAMONDS (UNSORTED / UNWORKED)', defaultGst: 0.25, unit: 'Cts' },
  { code: '71023910', description: 'CUT & POLISHED DIAMONDS', defaultGst: 1.5, unit: 'Cts' },
  { code: '71049100', description: 'LAB GROWN DIAMONDS (POLISHED)', defaultGst: 1.5, unit: 'Cts' },
  { code: '71031000', description: 'PRECIOUS AND SEMI-PRECIOUS STONES (ROUGH)', defaultGst: 0.25, unit: 'Cts' },
  { code: '71039100', description: 'PRECIOUS AND SEMI-PRECIOUS STONES (CUT & POLISHED)', defaultGst: 1.5, unit: 'Cts' },
  { code: '71131910', description: 'GOLD JEWELLERY STUDDED WITH DIAMONDS', defaultGst: 3.0, unit: 'Grams' },
  { code: '71131920', description: 'PLAIN GOLD JEWELLERY', defaultGst: 3.0, unit: 'Grams' },
  { code: '71131120', description: 'SILVER JEWELLERY', defaultGst: 3.0, unit: 'Grams' },
  { code: '998892', description: 'MAKING / JOB WORK CHARGES ON JEWELLERY', defaultGst: 5.0, unit: 'Pcs' },
];

export const DEFAULT_DECLARATION_TEXT = `* We declare that this Invoice Shows the actual price of the goods described and that all particulars are true and correct.
* The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict, in compliance with United Nations Resolutions and corresponding nation laws. The seller hereby guarantees that these diamonds are conflict free and confirms.
* By receipt of the above goods, then buyer/consignee acknowledges that the above goods purchased or received will be fully represented and disclosed as laboratory grown polished diamonds.
* Any claim or dispute arising from change in quality or shortage in quantity or any cause what-so-ever will not be entertained once the goods are delivered.
* Late payment charges at 24% p.a, will be charged on amount of the bill after due date.
* We are not responsible for any loss or damage during transit.
* Payment to be made by Payees A/c Cheque, Draft or NEFT/RTGS/IMPS only.
* No E-Way bill is required to be generated as the Goods covered under this invoice are exempted as per serial No.4/5 to the Annexure to Rule 138(14) of the CGST Rules2017.`;
