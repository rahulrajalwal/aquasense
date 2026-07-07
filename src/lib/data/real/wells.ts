// ─────────────────────────────────────────────────────────────────────────
//  REAL DATA — CGWB groundwater exploration wells, Pune district.
//
//  Source: Central Ground Water Board (CGWB), "Aquifer Mapping and
//  Management of Ground Water Resources, Pune District, Maharashtra"
//  (NAQUIM report, Central Region Nagpur), Annexure-I: Salient Features of
//  Ground Water Exploration — 146 exploratory (EW) / observation (OW)
//  wells. Cross-referenced with CGWB "Ground Water Information, Pune
//  District" (1810/DBR/2009, 2013).
//
//  Field notes:
//  • yieldLps — pump-test discharge. The NAQUIM annexure header prints
//    m³/hr, but the same values appear as lps in the 2013 district report
//    (e.g. Lavale 30.6); treated as lps and, for modelling, used as a
//    relative yield index. "Traces"/"meager" recorded as 0.05, "<0.14" as
//    0.1 (yieldRaw preserves the original token).
//  • aq1BottomM / aq2BottomM — bottom of Aquifer-I (weathered/jointed
//    basalt) and depth of Aquifer-II (jointed/fractured basalt) at the
//    well, m below ground level.
//  • Wells with a `note` carry source anomalies (coordinate typos in the
//    printed report, border-area locations); their coordinates are omitted
//    rather than guessed.
//  • Extraction from the published PDF was script-parsed and row-by-row
//    verified; 12 rows hand-corrected against the printed table.
// ─────────────────────────────────────────────────────────────────────────

export interface CgwbWell {
  sno: number
  taluka: string
  village: string
  type: 'EW' | 'OW'
  lon: number | null
  lat: number | null
  depthM: number | null
  preSwlM: number | null
  postSwlM: number | null
  /** pump-test discharge (lps-equivalent index); null = not pump-tested */
  yieldLps: number | null
  yieldRaw: string
  aq1BottomM: number | null
  aq2BottomM: number | null
  aq2ThickM: number | null
  zones: string
  note?: string
}

export const CGWB_WELLS: CgwbWell[] = [
  { sno: 1, taluka: "Akole", village: "Khireshwar", type: "EW", lon: 73.8069, lat: 19.3808, depthM: 200.0, preSwlM: 12.0, postSwlM: 2.25, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 98.0, aq2ThickM: 2.0, zones: "16 -31 ,50 - 12 2.25 EW 55", note: "Khireshwar (Akole taluka) lies on the Pune-Ahmadnagar border, outside Pune district proper; retained as border-area data point." },
  { sno: 2, taluka: "Ambegaon", village: "Bhavdi", type: "EW", lon: 73.8917, lat: 18.95, depthM: 200.0, preSwlM: 18.0, postSwlM: 12.9, yieldLps: null, yieldRaw: "-", aq1BottomM: 15.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "9 -15 ,27 - 18 12.9" },
  { sno: 3, taluka: "Ambegaon", village: "Pokhari", type: "EW", lon: 73.6972, lat: 19.0694, depthM: 200.0, preSwlM: 21.0, postSwlM: 14.15, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "21 14.15" },
  { sno: 4, taluka: "Ambegaon", village: "Shingave", type: "OW", lon: null, lat: null, depthM: 62.6, preSwlM: 7.76, postSwlM: null, yieldLps: null, yieldRaw: "-", aq1BottomM: 20, aq2BottomM: 32, aq2ThickM: 2, zones: "25.00-26.00, 30.00-32.50" },
  { sno: 5, taluka: "Ambegaon", village: "Shingave", type: "EW", lon: null, lat: null, depthM: 90, preSwlM: null, postSwlM: null, yieldLps: null, yieldRaw: "-", aq1BottomM: 20, aq2BottomM: 32, aq2ThickM: 2, zones: "" },
  { sno: 6, taluka: "Ambegaon", village: "Sriramnagar", type: "EW", lon: null, lat: null, depthM: 200.0, preSwlM: 21.0, postSwlM: 17.2, yieldLps: 1.14, yieldRaw: "1.14", aq1BottomM: 17.0, aq2BottomM: 84.0, aq2ThickM: 3.0, zones: "-18 21 17.2", note: "Printed coords 74.6979,18.4763 fall in Daund, not Ambegaon; omitted as suspect." },
  { sno: 7, taluka: "Ambegaon", village: "Takewadi", type: "EW", lon: 73.94, lat: 19.0394, depthM: 200.0, preSwlM: 14.0, postSwlM: 8.37, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "14 8.37" },
  { sno: 8, taluka: "Baramati", village: "Ambhi Khurd", type: "EW", lon: 74.2839, lat: 18.3056, depthM: 200.0, preSwlM: 70.0, postSwlM: 45.0, yieldLps: 0.05, yieldRaw: "Traces", aq1BottomM: 15.0, aq2BottomM: 65.0, aq2ThickM: 0.5, zones: "- 70 45" },
  { sno: 9, taluka: "Baramati", village: "Chandgudewadi", type: "EW", lon: 74.31, lat: 18.2983, depthM: 123.5, preSwlM: 12.3, postSwlM: 17.8, yieldLps: 4.43, yieldRaw: "4.43", aq1BottomM: 15.0, aq2BottomM: 120.0, aq2ThickM: 6.0, zones: "11.8, 12.3 17.8" },
  { sno: 10, taluka: "Baramati", village: "Chandgudewadi", type: "OW", lon: 74.31, lat: 18.2983, depthM: 200.0, preSwlM: 43.0, postSwlM: 17.8, yieldLps: 5.0, yieldRaw: "5", aq1BottomM: 21.0, aq2BottomM: 135.0, aq2ThickM: 0.5, zones: "43 17.8" },
  { sno: 11, taluka: "Baramati", village: "Choudharwadi", type: "EW", lon: 74.2669, lat: 18.1703, depthM: 200.0, preSwlM: 17.8, postSwlM: 5.0, yieldLps: 1.37, yieldRaw: "1.37", aq1BottomM: 20.0, aq2BottomM: 109.0, aq2ThickM: 3.0, zones: "109 17.8 5" },
  { sno: 12, taluka: "Baramati", village: "Dorlewadi", type: "EW", lon: 74.6144, lat: 18.0931, depthM: 200.0, preSwlM: 27.0, postSwlM: 24.1, yieldLps: 3.0, yieldRaw: "3", aq1BottomM: 25.0, aq2BottomM: 105.0, aq2ThickM: 3.0, zones: "105 27 24.1" },
  { sno: 13, taluka: "Baramati", village: "Dorlewadi", type: "OW", lon: 74.6144, lat: 18.0931, depthM: 200.0, preSwlM: 27.0, postSwlM: 24.1, yieldLps: 0.05, yieldRaw: "Traces", aq1BottomM: 15.0, aq2BottomM: 70.0, aq2ThickM: 0.5, zones: "35 27 24.1" },
  { sno: 14, taluka: "Baramati", village: "Loni Bhapkar", type: "EW", lon: 74.3847, lat: 18.2289, depthM: 200.0, preSwlM: 25.5, postSwlM: 12.0, yieldLps: 0.38, yieldRaw: "0.38", aq1BottomM: 20.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "- 25.5 12" },
  { sno: 15, taluka: "Baramati", village: "Pandhare", type: "EW", lon: 74.4653, lat: 18.1408, depthM: 200.0, preSwlM: 70.0, postSwlM: 45.0, yieldLps: 0.05, yieldRaw: "Traces", aq1BottomM: 15.0, aq2BottomM: 75.0, aq2ThickM: 0.5, zones: "- 70 45" },
  { sno: 16, taluka: "Baramati", village: "Parawadi", type: "EW", lon: 74.6525, lat: 18.2814, depthM: 142.0, preSwlM: 18.0, postSwlM: 4.85, yieldLps: 7.76, yieldRaw: "7.76", aq1BottomM: 25.0, aq2BottomM: 141.0, aq2ThickM: 9.0, zones: "65.00, 18 4.85 77.00, 141.00" },
  { sno: 17, taluka: "Baramati", village: "Parawadi", type: "OW", lon: 74.6525, lat: 18.2814, depthM: 200.0, preSwlM: 18.0, postSwlM: 7.85, yieldLps: 2.16, yieldRaw: "2.16", aq1BottomM: 20.0, aq2BottomM: 159.0, aq2ThickM: 9.0, zones: "159 18 7.85" },
  { sno: 18, taluka: "Baramati", village: "Rui", type: "EW", lon: 74.6167, lat: 18.1875, depthM: 198.2, preSwlM: 11.0, postSwlM: 4.87, yieldLps: 8.24, yieldRaw: "8.24", aq1BottomM: 25.0, aq2BottomM: 174.0, aq2ThickM: 12.0, zones: "12 -18 ,49 - 11 4.87 62 ,97 -152 ,70 -76 ,167 -174" },
  { sno: 19, taluka: "Baramati", village: "Rui", type: "OW", lon: 74.6167, lat: 18.1875, depthM: 58.0, preSwlM: 12.0, postSwlM: 2.19, yieldLps: 4.76, yieldRaw: "4.76", aq1BottomM: 21.0, aq2BottomM: 58.0, aq2ThickM: 12.0, zones: "15 -21 ,52 - 12 2.19" },
  { sno: 20, taluka: "Baramati", village: "Sherechiwadi", type: "EW", lon: 74.3639, lat: 18.2819, depthM: 195.2, preSwlM: 13.0, postSwlM: 3.5, yieldLps: 4.76, yieldRaw: "4.76", aq1BottomM: 15.0, aq2BottomM: 152.0, aq2ThickM: 12.0, zones: "9.2 -15.3, 13 3.5 33.6 -39.7, 112.9 -119, 91.6 -97.7, 128.2 - 143.4, 1" },
  { sno: 21, taluka: "Baramati", village: "Sherechiwadi", type: "OW", lon: 74.3639, lat: 18.2819, depthM: 152.6, preSwlM: 9.0, postSwlM: 4.38, yieldLps: 0.6, yieldRaw: "0.6", aq1BottomM: 15.0, aq2BottomM: 152.0, aq2ThickM: 12.0, zones: "9.2 -15.3 9 4.38" },
  { sno: 22, taluka: "Baramati", village: "Sherechiwadi", type: "OW", lon: 74.3639, lat: 18.2819, depthM: 24.5, preSwlM: 9.0, postSwlM: 4.2, yieldLps: 3.4, yieldRaw: "3.4", aq1BottomM: 15.0, aq2BottomM: 152.0, aq2ThickM: 12.0, zones: "9.2 -18.3 9 4.2" },
  { sno: 23, taluka: "Baramati", village: "Sonwadisupe", type: "EW", lon: 74.5111, lat: 18.2611, depthM: 200.0, preSwlM: 30.0, postSwlM: 21.0, yieldLps: 0.6, yieldRaw: "0.6", aq1BottomM: 20.0, aq2BottomM: 90.0, aq2ThickM: 2.0, zones: "30 21" },
  { sno: 24, taluka: "Baramati", village: "Tandulwadi", type: "EW", lon: 74.5883, lat: 18.1825, depthM: 93.0, preSwlM: 11.0, postSwlM: 2.3, yieldLps: 12.18, yieldRaw: "12.18", aq1BottomM: 30.0, aq2BottomM: 91.0, aq2ThickM: 3.0, zones: "30 .00, 11 2.3 91.00" },
  { sno: 25, taluka: "Baramati", village: "Tandulwadi", type: "OW", lon: 74.5883, lat: 18.1825, depthM: 200.0, preSwlM: 19.0, postSwlM: 11.1, yieldLps: 2.16, yieldRaw: "2.16", aq1BottomM: 20.0, aq2BottomM: 149.0, aq2ThickM: 3.0, zones: "149 19 11.1" },
  { sno: 26, taluka: "Baramati", village: "Wadgaon", type: "EW", lon: 74.3606, lat: 18.1297, depthM: 200.0, preSwlM: 9.0, postSwlM: 5.1, yieldLps: 2.16, yieldRaw: "2.16", aq1BottomM: 24.0, aq2BottomM: 90.0, aq2ThickM: 3.0, zones: "24 9 5.1 Nimbalkar" },
  { sno: 27, taluka: "Bhor", village: "Apti", type: "EW", lon: 73.7546, lat: 18.116, depthM: 123.0, preSwlM: 19.34, postSwlM: 8.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 18.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "-18 19.34 8" },
  { sno: 28, taluka: "Bhor", village: "Apti", type: "OW", lon: 73.7544, lat: 18.1158, depthM: 200.0, preSwlM: 18.3, postSwlM: 8.0, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 18.0, aq2BottomM: 125.0, aq2ThickM: 3.0, zones: "-49 18.3 8" },
  { sno: 29, taluka: "Bhor", village: "Bhor", type: "EW", lon: 73.8415, lat: 18.1449, depthM: 200.0, preSwlM: 16.0, postSwlM: 5.85, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 105.0, aq2ThickM: 1.0, zones: "-21 16 5.85" },
  { sno: 30, taluka: "Bhor", village: "Kikavi1", type: "EW", lon: 73.94475, lat: 18.20098, depthM: 200.0, preSwlM: 52.12, postSwlM: null, yieldLps: 5.0, yieldRaw: "5", aq1BottomM: 25.0, aq2BottomM: 70.0, aq2ThickM: 4.0, zones: "Water Zone 52.12 3 I- 36.00 - 38.00 mbgl,Water zone II- 55.00- 56.50 m" },
  { sno: 31, taluka: "Bhor", village: "Kikvi", type: "OW", lon: 73.9481, lat: 18.2196, depthM: 63.0, preSwlM: 30.0, postSwlM: 14.25, yieldLps: 2.34, yieldRaw: "2.34", aq1BottomM: 26.0, aq2BottomM: 60.0, aq2ThickM: 4.0, zones: "6.8 - ,24.5 - 30 14.25" },
  { sno: 32, taluka: "Bhor", village: "Kikvi", type: "OW", lon: 73.9465, lat: 18.2196, depthM: 60.0, preSwlM: 30.0, postSwlM: 14.2, yieldLps: 3.42, yieldRaw: "3.42", aq1BottomM: 20.0, aq2BottomM: 41.0, aq2ThickM: 3.0, zones: "-41 30 14.2" },
  { sno: 33, taluka: "Bhor", village: "Kikvi", type: "EW", lon: 73.9471, lat: 18.2202, depthM: 190.0, preSwlM: 30.0, postSwlM: 14.2, yieldLps: 6.0, yieldRaw: "6", aq1BottomM: 26.0, aq2BottomM: 125.0, aq2ThickM: 6.0, zones: "2.5 - ,26.5 - 30 14.2 ,54 - ,42.7 -" },
  { sno: 34, taluka: "Bhor", village: "Narsapur", type: "EW", lon: 73.8783, lat: 18.2458, depthM: 92.25, preSwlM: 16.6, postSwlM: 16.6, yieldLps: 8.25, yieldRaw: "8.25", aq1BottomM: 16.0, aq2BottomM: 85.0, aq2ThickM: 3.0, zones: "16 - ,54 - 16.6 16.6" },
  { sno: 35, taluka: "Bhor", village: "Narsapur", type: "OW", lon: 73.8783, lat: 18.2458, depthM: 190.0, preSwlM: 13.45, postSwlM: 13.45, yieldLps: null, yieldRaw: "-", aq1BottomM: 16.0, aq2BottomM: 85.0, aq2ThickM: 3.0, zones: "-84 13.45 13.45" },
  { sno: 36, taluka: "Bhor", village: "Pasure", type: "EW", lon: 73.78354, lat: 18.19463, depthM: 200.0, preSwlM: 80.0, postSwlM: 45.0, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 25.0, aq2BottomM: 170.0, aq2ThickM: 0.5, zones: "seepage 1 80 45 8 7 at 44.30, seepage 2 at 163.20 mbgl" },
  { sno: 37, taluka: "Bhor", village: "Penjalwadi", type: "EW", lon: 74.0222, lat: 18.1728, depthM: 200.0, preSwlM: 17.0, postSwlM: 11.0, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 27.0, aq2BottomM: 125.0, aq2ThickM: 2.0, zones: "-27 17 11" },
  { sno: 38, taluka: "Bhor", village: "Salav", type: "EW", lon: 73.73458, lat: 18.09141, depthM: 200.0, preSwlM: 105.0, postSwlM: null, yieldLps: 0.5, yieldRaw: "0.5", aq1BottomM: 25.0, aq2BottomM: 170.0, aq2ThickM: 2.0, zones: "seepage 105 5 3 108:30, Water Zone I- 160.00- 163.20 mbgl" },
  { sno: 39, taluka: "Daund", village: "Ambegaon", type: "EW", lon: 74.3583, lat: 18.4694, depthM: 195.3, preSwlM: 14.0, postSwlM: 7.95, yieldLps: 1.05, yieldRaw: "1.05", aq1BottomM: 19.0, aq2BottomM: 145.0, aq2ThickM: 2.0, zones: "- ,184.5 14 7.95 -" },
  { sno: 40, taluka: "Daund", village: "Boribel", type: "EW", lon: 74.6522, lat: 18.4042, depthM: 152.5, preSwlM: 12.0, postSwlM: 3.28, yieldLps: 9.84, yieldRaw: "9.84", aq1BottomM: 24.0, aq2BottomM: 125.0, aq2ThickM: 4.0, zones: "5 - ,24 - 12 3.28" },
  { sno: 41, taluka: "Daund", village: "Boribel", type: "OW", lon: 74.6522, lat: 18.4042, depthM: 103.8, preSwlM: 12.0, postSwlM: 3.49, yieldLps: 12.18, yieldRaw: "12.18", aq1BottomM: 25.0, aq2BottomM: 90.0, aq2ThickM: 4.0, zones: "5 - ,25 - 12 3.49" },
  { sno: 42, taluka: "Daund", village: "Dahitane", type: "EW", lon: 74.21078, lat: 18.54605, depthM: 200.0, preSwlM: 120.0, postSwlM: 110.0, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 20.0, aq2BottomM: 190.0, aq2ThickM: 0.5, zones: "I-13.80- 120 110 7 16.80, II- 117.50- 120.50, III- 135.80- 138.80, IV-" },
  { sno: 43, taluka: "Daund", village: "Khor", type: "EW", lon: 74.3264, lat: 18.4, depthM: 146.7, preSwlM: 17.0, postSwlM: 4.3, yieldLps: 3.17, yieldRaw: "3.17", aq1BottomM: 25.0, aq2BottomM: 143.0, aq2ThickM: 6.0, zones: "110 - ,143 - 17 4.3" },
  { sno: 44, taluka: "Daund", village: "Khor", type: "OW", lon: 74.3264, lat: 18.4, depthM: 150.0, preSwlM: 12.0, postSwlM: 3.41, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 108.0, aq2ThickM: 2.0, zones: "- ,108 - 12 3.41" },
  { sno: 45, taluka: "Daund", village: "Kurkumbh", type: "EW", lon: 74.53987, lat: 18.39324, depthM: 200.0, preSwlM: 90.2, postSwlM: 45, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 10, aq2BottomM: null, aq2ThickM: 0.5, zones: "I-73.70-74.80, II-93-95, III-101.00-102.20" },
  { sno: 46, taluka: "Daund", village: "Patas", type: "EW", lon: 74.46124, lat: 18.43556, depthM: 200.0, preSwlM: 5.52, postSwlM: null, yieldLps: 0.38, yieldRaw: "0.38", aq1BottomM: 30.0, aq2BottomM: 60.0, aq2ThickM: 1.0, zones: "I-7-7.70, II- 5.52 3 1 33-35" },
  { sno: 47, taluka: "Daund", village: "Vasunde", type: "EW", lon: 74.5, lat: 18.3333, depthM: 32.0, preSwlM: null, postSwlM: null, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "" },
  { sno: 48, taluka: "Daund", village: "Vasunde", type: "EW", lon: 74.5, lat: 18.3333, depthM: 180.0, preSwlM: 32.0, postSwlM: 19.0, yieldLps: 9.84, yieldRaw: "9.84", aq1BottomM: 25.0, aq2BottomM: 178.0, aq2ThickM: 6.0, zones: "109 - ,178 - 32 19" },
  { sno: 49, taluka: "Daund", village: "Vasunde", type: "OW", lon: 74.5, lat: 18.3333, depthM: 180.0, preSwlM: 32.0, postSwlM: 19.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 25.0, aq2BottomM: 178.0, aq2ThickM: 2.0, zones: "- ,178 - 32 19" },
  { sno: 50, taluka: "Haveli", village: "CWPRS", type: "EW", lon: 73.7911, lat: 18.4461, depthM: 200.0, preSwlM: 14.0, postSwlM: 5.6, yieldLps: 4.08, yieldRaw: "4.08", aq1BottomM: 20.0, aq2BottomM: 135.0, aq2ThickM: 4.0, zones: "11 - ,49.5 - 14 5.6" },
  { sno: 51, taluka: "Haveli", village: "CWPRS", type: "OW", lon: 73.7911, lat: 18.4461, depthM: 128.0, preSwlM: 12.0, postSwlM: 4.5, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 90.0, aq2ThickM: 2.0, zones: "-47.5 12 4.5" },
  { sno: 52, taluka: "Haveli", village: "CWPRS-EW", type: "EW", lon: 73.7784, lat: 18.4478, depthM: 200.0, preSwlM: 9.0, postSwlM: 4.0, yieldLps: 4.77, yieldRaw: "4.77", aq1BottomM: 17.0, aq2BottomM: 93.0, aq2ThickM: 3.0, zones: "17-18,90- 9 4" },
  { sno: 53, taluka: "Haveli", village: "CWPRS-OW", type: "OW", lon: 73.7785, lat: 18.4475, depthM: 172.4, preSwlM: 9.0, postSwlM: 4.0, yieldLps: 2.16, yieldRaw: "2.16", aq1BottomM: 20.0, aq2BottomM: 120.0, aq2ThickM: 5.0, zones: "20.30 - 9 4 21.30,119.5 0 -120.00" },
  { sno: 54, taluka: "Haveli", village: "Dighi", type: "EW", lon: 73.8714, lat: 18.6106, depthM: 158.6, preSwlM: 18.0, postSwlM: 6.4, yieldLps: 8.25, yieldRaw: "8.25", aq1BottomM: 27.0, aq2BottomM: 122.0, aq2ThickM: 9.0, zones: "11 - ,27.5 - 18 6.4 30.6 ,112 - ,63 - ,122" },
  { sno: 55, taluka: "Haveli", village: "Dighi", type: "OW", lon: 73.8714, lat: 18.6106, depthM: 42.7, preSwlM: 18.0, postSwlM: 6.4, yieldLps: 3.42, yieldRaw: "3.42", aq1BottomM: 27.0, aq2BottomM: 42.0, aq2ThickM: 9.0, zones: "16 - ,34 - 18 6.4" },
  { sno: 56, taluka: "Haveli", village: "Dighi", type: "OW", lon: 73.8714, lat: 18.6106, depthM: 200.0, preSwlM: 18.0, postSwlM: 6.4, yieldLps: null, yieldRaw: "-", aq1BottomM: 27.0, aq2BottomM: 122.0, aq2ThickM: 9.0, zones: "18 6.4" },
  { sno: 57, taluka: "Haveli", village: "Khamgaon", type: "EW", lon: 73.7333, lat: 18.3639, depthM: 138.2, preSwlM: 22.58, postSwlM: 13.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "22.58 13" },
  { sno: 58, taluka: "Haveli", village: "Lohgaon", type: "EW", lon: 73.9264, lat: 18.5736, depthM: 197.3, preSwlM: 9.0, postSwlM: 2.54, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 15.0, aq2BottomM: 110.0, aq2ThickM: 3.0, zones: "9-11, 49.5-52 (source shows '09-Nov' artifact)" },
  { sno: 59, taluka: "Haveli", village: "Manjari", type: "EW", lon: 73.9738, lat: 18.5138, depthM: 200.0, preSwlM: 12.0, postSwlM: 7.3, yieldLps: 8.25, yieldRaw: "8.25", aq1BottomM: 12.0, aq2BottomM: 52.0, aq2ThickM: 4.0, zones: "10 -12 12 7.3 ,49.5 -52" },
  { sno: 60, taluka: "Haveli", village: "Manjari", type: "OW", lon: 73.9736, lat: 18.5133, depthM: 32.5, preSwlM: 12.0, postSwlM: 7.3, yieldLps: 0.85, yieldRaw: "0.85", aq1BottomM: 12.0, aq2BottomM: 32.0, aq2ThickM: 1.0, zones: "-10 12 7.3" },
  { sno: 61, taluka: "Haveli", village: "Nhavi Sandas", type: "EW", lon: 74.1578, lat: 18.6028, depthM: 90.1, preSwlM: 21.0, postSwlM: 10.22, yieldLps: 8.25, yieldRaw: "8.25", aq1BottomM: 10.0, aq2BottomM: 87.0, aq2ThickM: 6.0, zones: "-87 21 10.22" },
  { sno: 62, taluka: "Haveli", village: "Nhavi Sandas", type: "OW", lon: 74.1578, lat: 18.6028, depthM: 28.6, preSwlM: 21.0, postSwlM: 10.22, yieldLps: 4.76, yieldRaw: "4.76", aq1BottomM: 28.0, aq2BottomM: 28.0, aq2ThickM: 6.0, zones: "12 - ,15.4 - 21 10.22" },
  { sno: 63, taluka: "Haveli", village: "Nhavi Sandas", type: "OW", lon: 74.1578, lat: 18.6028, depthM: 129.2, preSwlM: 21.0, postSwlM: 10.22, yieldLps: 12.88, yieldRaw: "12.88", aq1BottomM: 18.0, aq2BottomM: 104.0, aq2ThickM: 6.0, zones: "18.4 - ,22 - 21 10.22 ,104 - ,38 -" },
  { sno: 64, taluka: "Haveli", village: "Ravet", type: "EW", lon: 73.7413, lat: 18.6464, depthM: 200.0, preSwlM: 10.0, postSwlM: 3.2, yieldLps: null, yieldRaw: "-", aq1BottomM: 25.0, aq2BottomM: 175.0, aq2ThickM: 2.0, zones: "4 - ,175 - 10 3.2" },
  { sno: 65, taluka: "Haveli", village: "Shindawane", type: "EW", lon: 74.1278, lat: 18.4361, depthM: 200.0, preSwlM: 16.0, postSwlM: 8.9, yieldLps: 2.34, yieldRaw: "2.34", aq1BottomM: 25.0, aq2BottomM: 175.0, aq2ThickM: 3.0, zones: "-7 16 8.9" },
  { sno: 66, taluka: "Haveli", village: "Shindawane", type: "OW", lon: 74.1278, lat: 18.4361, depthM: 31.5, preSwlM: 16.0, postSwlM: 8.9, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 31.0, aq2BottomM: 31.0, aq2ThickM: 3.0, zones: "-8.5 16 8.9" },
  { sno: 67, taluka: "Haveli", village: "Vade", type: "EW", lon: 74.0628, lat: 18.5514, depthM: 200.0, preSwlM: 12.0, postSwlM: 2.0, yieldLps: 4.08, yieldRaw: "4.08", aq1BottomM: 14.0, aq2BottomM: 135.0, aq2ThickM: 4.0, zones: "8 - ,64 - 12 2" },
  { sno: 68, taluka: "Haveli", village: "Vade", type: "OW", lon: 74.0628, lat: 18.5514, depthM: 87.0, preSwlM: 12.0, postSwlM: 1.92, yieldLps: null, yieldRaw: "-", aq1BottomM: 14.0, aq2BottomM: 64.0, aq2ThickM: 1.0, zones: "8 - ,64 - 12 1.92" },
  { sno: 69, taluka: "Haveli", village: "Wadgaon Shinde", type: "EW", lon: 73.9611, lat: 18.6208, depthM: 200.0, preSwlM: 18.0, postSwlM: 9.9, yieldLps: 1.35, yieldRaw: "1.35", aq1BottomM: 15.0, aq2BottomM: 158.0, aq2ThickM: 3.0, zones: "14.8 - ,158 18 9.9 -" },
  { sno: 70, taluka: "Indapur", village: "Bawda-EW", type: "EW", lon: 74.9913, lat: 17.9679, depthM: 200.0, preSwlM: 15.0, postSwlM: 6.31, yieldLps: 9.84, yieldRaw: "9.84", aq1BottomM: 24.0, aq2BottomM: 54.0, aq2ThickM: 3.0, zones: "24-26 15 6.31 53.00- 54.00" },
  { sno: 71, taluka: "Indapur", village: "Bawda-OW", type: "OW", lon: 74.9912, lat: 17.9677, depthM: 81.0, preSwlM: 13.0, postSwlM: 4.66, yieldLps: 0.78, yieldRaw: "0.78", aq1BottomM: 24.0, aq2BottomM: 54.0, aq2ThickM: 3.0, zones: "24-26 13 4.66 53.00- 54.01" },
  { sno: 72, taluka: "Indapur", village: "Gokondi", type: "EW", lon: 74.8681, lat: 18.0739, depthM: 200.0, preSwlM: 19.0, postSwlM: 9.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 10.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "-10 19 9" },
  { sno: 73, taluka: "Indapur", village: "Loni Deokar", type: "EW", lon: 74.9153, lat: 18.2042, depthM: null, preSwlM: 13, postSwlM: 7, yieldLps: null, yieldRaw: "-", aq1BottomM: 13, aq2BottomM: 98, aq2ThickM: 1, zones: "" },
  { sno: 74, taluka: "Indapur", village: "Malwadi", type: "EW", lon: 75.0556, lat: 18.15, depthM: 200.0, preSwlM: 19.0, postSwlM: 6.0, yieldLps: 0.56, yieldRaw: "0.56", aq1BottomM: 12.0, aq2BottomM: 105.0, aq2ThickM: 2.0, zones: "-5.4 19 6" },
  { sno: 75, taluka: "Indapur", village: "Nirgude", type: "EW", lon: 74.7056, lat: 18.2192, depthM: 200.0, preSwlM: 14.0, postSwlM: 2.05, yieldLps: null, yieldRaw: "-", aq1BottomM: 14.0, aq2BottomM: 86.0, aq2ThickM: 1.0, zones: "-5 14 2.05" },
  { sno: 76, taluka: "Indapur", village: "Vakil Basti", type: "EW", lon: 74.99115, lat: 17.9958, depthM: 200.0, preSwlM: 17.0, postSwlM: 10.48, yieldLps: null, yieldRaw: "-", aq1BottomM: 24.0, aq2BottomM: 115.0, aq2ThickM: 1.0, zones: "-24 17 10.48" },
  { sno: 77, taluka: "Indapur", village: "Wadapuri", type: "EW", lon: null, lat: null, depthM: 200, preSwlM: 96, postSwlM: null, yieldLps: 0.1, yieldRaw: "<0.14", aq1BottomM: 12, aq2BottomM: 87, aq2ThickM: 3, zones: "84.00-87.00" },
  { sno: 78, taluka: "Junnar", village: "Gunjalwadi", type: "EW", lon: 73.9414, lat: 19.125, depthM: 200.0, preSwlM: 21.0, postSwlM: 3.9, yieldLps: 4.8, yieldRaw: "4.8", aq1BottomM: 21.0, aq2BottomM: 189.0, aq2ThickM: 9.0, zones: "6 -10 ,22 - 21 3.9 37 ,83 -92 ,49 -58 ,180 -189" },
  { sno: 79, taluka: "Junnar", village: "Gunjalwadi", type: "OW", lon: 73.9414, lat: 19.125, depthM: 104.2, preSwlM: 17.0, postSwlM: 4.53, yieldLps: 10.45, yieldRaw: "10.45", aq1BottomM: 24.0, aq2BottomM: 76.0, aq2ThickM: 12.0, zones: "6 -9 ,24 -40 17 4.53 ,85 -95 ,70 -76" },
  { sno: 80, taluka: "Junnar", village: "Gunjalwadi", type: "OW", lon: 73.9414, lat: 19.125, depthM: 43.0, preSwlM: 21.0, postSwlM: 4.01, yieldLps: 3.42, yieldRaw: "3.42", aq1BottomM: 25.0, aq2BottomM: 37.0, aq2ThickM: 4.0, zones: "9.5 -15.8 21 4.01 ,25 -37" },
  { sno: 81, taluka: "Junnar", village: "Khamundi", type: "EW", lon: 74.0194, lat: 19.2375, depthM: 194.0, preSwlM: 27.0, postSwlM: 17.9, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 110.0, aq2ThickM: 4.0, zones: "46 -55 ,104 27 17.9 -110" },
  { sno: 82, taluka: "Junnar", village: "Sawargaon", type: "EW", lon: 73.8972, lat: 19.125, depthM: 200.0, preSwlM: 18.0, postSwlM: 9.52, yieldLps: null, yieldRaw: "-", aq1BottomM: 19.0, aq2BottomM: 154.0, aq2ThickM: 1.0, zones: "18 9.52" },
  { sno: 83, taluka: "Junnar", village: "Wanewadi", type: "EW", lon: 73.7717, lat: 19.2068, depthM: 200.0, preSwlM: 19.0, postSwlM: 14.4, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 83.0, aq2ThickM: 1.0, zones: "33 -42 ,80 - 19 14.4" },
  { sno: 84, taluka: "Khed", village: "Chikhali", type: "EW", lon: 73.8167, lat: 18.6847, depthM: 200.0, preSwlM: 18.0, postSwlM: 11.6, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 24.0, aq2BottomM: 139.0, aq2ThickM: 3.0, zones: "24 - ,39 - 18 11.6" },
  { sno: 85, taluka: "Khed", village: "Dehane", type: "EW", lon: 73.6586, lat: 19.0231, depthM: 200.0, preSwlM: 16.0, postSwlM: 9.72, yieldLps: 4.07, yieldRaw: "4.07", aq1BottomM: 21.0, aq2BottomM: 169.0, aq2ThickM: 12.0, zones: "21 -51 ,64 - 16 9.72 70 ,109 - 115 ,91 - 100 ,161 - 167" },
  { sno: 86, taluka: "Khed", village: "Dehane", type: "OW", lon: 73.6586, lat: 19.0231, depthM: 150.0, preSwlM: 16.0, postSwlM: 9.55, yieldLps: 3.4, yieldRaw: "3.4", aq1BottomM: 24.0, aq2BottomM: 105.0, aq2ThickM: 12.0, zones: "24 -27 ,39 - 16 9.55 49 ,131 - 137 ,57 -70" },
  { sno: 87, taluka: "Khed", village: "Kadus", type: "EW", lon: 73.825, lat: 18.875, depthM: 200.0, preSwlM: 16.0, postSwlM: 9.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 105.0, aq2ThickM: 1.0, zones: "16 9" },
  { sno: 88, taluka: "Khed", village: "Kharpudi", type: "EW", lon: 73.925, lat: 18.8, depthM: 189.1, preSwlM: 55.0, postSwlM: 27.0, yieldLps: 3.4, yieldRaw: "3.4", aq1BottomM: 25.0, aq2BottomM: 113.0, aq2ThickM: 5.0, zones: "36 -39 ,100 55 27 -113" },
  { sno: 89, taluka: "Khed", village: "Kharpudi", type: "OW", lon: 73.925, lat: 18.8, depthM: 115.9, preSwlM: 55.0, postSwlM: 27.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 18.0, aq2BottomM: 105.0, aq2ThickM: 5.0, zones: "55 27" },
  { sno: 90, taluka: "Khed", village: "Vetale", type: "EW", lon: 73.79124, lat: 18.94793, depthM: 200.0, preSwlM: 14.25, postSwlM: null, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 10, aq2BottomM: 90, aq2ThickM: 0.5, zones: "Water Zone I-68.70-71.70" },
  { sno: 91, taluka: "Khed", village: "Wada", type: "EW", lon: 73.74822, lat: 19.01803, depthM: 200.0, preSwlM: 100, postSwlM: null, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 10, aq2BottomM: 120, aq2ThickM: 0.5, zones: "seepage at 90.00 and 114.40" },
  { sno: 92, taluka: "Khed", village: "Yelwadi", type: "EW", lon: 73.7667, lat: 18.7333, depthM: 164.7, preSwlM: 14.0, postSwlM: 5.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 24.0, aq2BottomM: 76.0, aq2ThickM: 1.0, zones: "15 -24 ,67 - 14 5" },
  { sno: 93, taluka: "Maval", village: "Shilatane", type: "EW", lon: 73.49753, lat: 18.76785, depthM: 200.0, preSwlM: 130, postSwlM: 55, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 10, aq2BottomM: 90, aq2ThickM: 0.5, zones: "seepage 35.10, Water Zone I-74.80" },
  { sno: 94, taluka: "Maval", village: "Ahirwade", type: "EW", lon: 73.5851, lat: 18.7379, depthM: 180.0, preSwlM: 50.0, postSwlM: 32.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 18.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "-18 50 32" },
  { sno: 95, taluka: "Maval", village: "Bhoyre", type: "EW", lon: 73.6047, lat: 18.8586, depthM: 180.5, preSwlM: 21.0, postSwlM: 10.5, yieldLps: 3.0, yieldRaw: "3", aq1BottomM: 21.0, aq2BottomM: 102.0, aq2ThickM: 3.0, zones: "21 - ,102 - 21 10.5" },
  { sno: 96, taluka: "Maval", village: "Chankhed", type: "EW", lon: 73.6528, lat: 18.65, depthM: 200.0, preSwlM: 20.0, postSwlM: 14.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 14.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "-14 20 14" },
  { sno: 97, taluka: "Maval", village: "Vadgaon", type: "EW", lon: 73.6426, lat: 18.7316, depthM: 200.0, preSwlM: 12.0, postSwlM: 4.3, yieldLps: 0.85, yieldRaw: "0.85", aq1BottomM: 18.0, aq2BottomM: 103.0, aq2ThickM: 1.0, zones: "18 - ,103 - 12 4.3" },
  { sno: 98, taluka: "Mulshi", village: "Balewadi", type: "EW", lon: 73.7708, lat: 18.5744, depthM: 200.0, preSwlM: 20.0, postSwlM: 8.48, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 15.0, aq2BottomM: 145.0, aq2ThickM: 2.0, zones: "11.5 - ,45 - 20 8.48" },
  { sno: 99, taluka: "Mulshi", village: "Belawade", type: "EW", lon: 73.605, lat: 18.4875, depthM: 200.0, preSwlM: 17.0, postSwlM: 8.9, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 27.0, aq2BottomM: 127.0, aq2ThickM: 3.0, zones: "6.5 -6.5 17 8.9 ,27.5 -27.5" },
  { sno: 100, taluka: "Mulshi", village: "Hadshi", type: "EW", lon: 73.52171, lat: 18.59036, depthM: 200.0, preSwlM: 120, postSwlM: 95, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 5, aq2BottomM: 190, aq2ThickM: 0.5, zones: "seepage 99.20, Water Zone I-187.60" },
  { sno: 101, taluka: "Mulshi", village: "Kolwan", type: "EW", lon: 73.5307, lat: 18.5746, depthM: 200.0, preSwlM: 11.0, postSwlM: 3.74, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 135.0, aq2ThickM: 1.0, zones: "7-8 (source shows '07-Aug' artifact)" },
  { sno: 102, taluka: "Mulshi", village: "Lavale", type: "EW", lon: 73.715, lat: 18.5431, depthM: 85.0, preSwlM: 12.0, postSwlM: 3.76, yieldLps: 30.68, yieldRaw: "30.68", aq1BottomM: 15.0, aq2BottomM: 64.0, aq2ThickM: 3.0, zones: "7 - ,12 - ,48 12 3.76 - ,34 -37 ,62 -64" },
  { sno: 103, taluka: "Mulshi", village: "Lavale", type: "OW", lon: 73.715, lat: 18.5431, depthM: 200.0, preSwlM: 12.0, postSwlM: 3.76, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 120.0, aq2ThickM: 3.0, zones: "12 3.76" },
  { sno: 104, taluka: "Mulshi", village: "Lavale", type: "OW", lon: 73.715, lat: 18.5431, depthM: 75.0, preSwlM: 12.0, postSwlM: 3.76, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 20.0, aq2BottomM: 66.0, aq2ThickM: 3.0, zones: "35.5 -35.5 12 3.76" },
  { sno: 105, taluka: "Mulshi", village: "Lavale", type: "OW", lon: 73.715, lat: 18.5431, depthM: 75.0, preSwlM: 12.0, postSwlM: 3.76, yieldLps: 1.14, yieldRaw: "1.14", aq1BottomM: 20.0, aq2BottomM: 66.0, aq2ThickM: 3.0, zones: "66 -66 12 3.76" },
  { sno: 106, taluka: "Mulshi", village: "Lavale", type: "OW", lon: 73.715, lat: 18.5431, depthM: 75.0, preSwlM: 9.0, postSwlM: 3.4, yieldLps: 1.14, yieldRaw: "1.14", aq1BottomM: 13.0, aq2BottomM: 66.0, aq2ThickM: 3.0, zones: "27.5 - ,66 - 9 3.4" },
  { sno: 107, taluka: "Mulshi", village: "Maale", type: "EW", lon: 73.52361, lat: 18.5269, depthM: 200.0, preSwlM: 130, postSwlM: 95, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 15, aq2BottomM: 75, aq2ThickM: 0.5, zones: "Water Zone I-26.50-28.50" },
  { sno: 108, taluka: "Mulshi", village: "Manjari", type: "OW", lon: 73.9731, lat: 18.5138, depthM: 62.0, preSwlM: 12.0, postSwlM: 7.3, yieldLps: null, yieldRaw: "-", aq1BottomM: 12.0, aq2BottomM: 62.0, aq2ThickM: 1.0, zones: "30 -31 12 7.3" },
  { sno: 109, taluka: "Pune City", village: "Katraj", type: "EW", lon: 73.8686, lat: 18.4589, depthM: 200.0, preSwlM: 11.4, postSwlM: 6.0, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 13.0, aq2BottomM: 134.0, aq2ThickM: 3.0, zones: "13 - ,34 - 11.4 6" },
  { sno: 110, taluka: "Pune City", village: "KVBEG Yerawada", type: "EW", lon: 73.8778, lat: 18.5431, depthM: 36.6, preSwlM: 17.0, postSwlM: 10.0, yieldLps: 2.85, yieldRaw: "2.85", aq1BottomM: 12.0, aq2BottomM: 36.0, aq2ThickM: 3.0, zones: "4 - ,9 - 17 10 Yerawada" },
  { sno: 111, taluka: "Pune City", village: "KVBEG Yerawada", type: "OW", lon: 73.8778, lat: 18.5431, depthM: 21.0, preSwlM: 17.0, postSwlM: 10.0, yieldLps: 2.85, yieldRaw: "2.85", aq1BottomM: 12.0, aq2BottomM: 21.0, aq2ThickM: 3.0, zones: "5 - ,7 - 17 10 Yerawada" },
  { sno: 112, taluka: "Pune City", village: "Pune", type: "EW", lon: 73.8236, lat: 18.5542, depthM: 201.3, preSwlM: 9.0, postSwlM: 2.9, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 20.0, aq2BottomM: 152.0, aq2ThickM: 3.0, zones: "4.5 - ,152 - 9 2.9" },
  { sno: 113, taluka: "Pune City", village: "Pune", type: "OW", lon: 73.8236, lat: 18.5542, depthM: 32.5, preSwlM: 10.0, postSwlM: 3.2, yieldLps: null, yieldRaw: "-", aq1BottomM: 18.0, aq2BottomM: 104.0, aq2ThickM: 1.0, zones: "-18 10 3.2" },
  { sno: 114, taluka: "Pune City", village: "Yerawada", type: "EW", lon: 73.8778, lat: 18.5431, depthM: 200.0, preSwlM: 50.0, postSwlM: 27.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 11.0, aq2BottomM: 132.0, aq2ThickM: 1.0, zones: "9 - ,132 - 50 27" },
  { sno: 115, taluka: "Purandhar", village: "Gulunche", type: "EW", lon: 74.2264, lat: 18.1456, depthM: 200.0, preSwlM: 35.0, postSwlM: 17.0, yieldLps: 0.01, yieldRaw: "0.01", aq1BottomM: 18.0, aq2BottomM: 168.0, aq2ThickM: 0.5, zones: "84.60, 35 17 168.00" },
  { sno: 116, taluka: "Purandhar", village: "Jadhavwadi", type: "EW", lon: 74.0014, lat: 18.3917, depthM: 112.0, preSwlM: 50.0, postSwlM: 35.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 65.0, aq2ThickM: 1.0, zones: "-65 50 35" },
  { sno: 117, taluka: "Purandhar", village: "Kothale", type: "EW", lon: 74.125, lat: 18.3153, depthM: 165.0, preSwlM: 17.0, postSwlM: 10.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 28.0, aq2BottomM: 100.0, aq2ThickM: 1.0, zones: "28 - ,100 - 17 10" },
  { sno: 118, taluka: "Purandhar", village: "Narayanpur", type: "EW", lon: null, lat: null, depthM: 160.0, preSwlM: 18.0, postSwlM: 5.1, yieldLps: 7.76, yieldRaw: "7.76", aq1BottomM: 20.0, aq2BottomM: 120.0, aq2ThickM: 3.0, zones: "32 18 5.1", note: "Printed lat 19.1241 inconsistent with Purandhar taluka; coords omitted." },
  { sno: 119, taluka: "Purandhar", village: "Narayanpur", type: "OW", lon: null, lat: null, depthM: 200.0, preSwlM: 18.0, postSwlM: 5.8, yieldLps: 0.05, yieldRaw: "Traces", aq1BottomM: 25.0, aq2BottomM: 90.0, aq2ThickM: 0.5, zones: "34.8 18 5.8", note: "Printed lat 19.1237 inconsistent with Purandhar taluka; coords omitted." },
  { sno: 120, taluka: "Purandhar", village: "Naygaon", type: "EW", lon: 74.2333, lat: 18.3667, depthM: 200.0, preSwlM: 12.0, postSwlM: 4.5, yieldLps: 1.13, yieldRaw: "1.13", aq1BottomM: 20.0, aq2BottomM: 90.0, aq2ThickM: 4.0, zones: "42 -51 ,58 - 12 4.5" },
  { sno: 121, taluka: "Purandhar", village: "Naygaon (Khorawade)", type: "EW", lon: 74.2333, lat: 18.3667, depthM: 200.0, preSwlM: 11.4, postSwlM: 6.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 105.0, aq2ThickM: 1.0, zones: "9 - ,21 - 11.4 6 (Khorawade)" },
  { sno: 122, taluka: "Purandhar", village: "Pangare Sailar", type: "EW", lon: 74.0639, lat: 18.27, depthM: 184.7, preSwlM: 22.2, postSwlM: 16.0, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 23.0, aq2BottomM: 135.0, aq2ThickM: 1.0, zones: "-23 22.2 16 Vasti" },
  { sno: 123, taluka: "Purandhar", village: "Parainche", type: "EW", lon: 74.0839, lat: 18.1917, depthM: 200.0, preSwlM: 70.0, postSwlM: 45.0, yieldLps: 0.05, yieldRaw: "Traces", aq1BottomM: 20.0, aq2BottomM: 108.0, aq2ThickM: 0.5, zones: "41.00, 70 45 108.00" },
  { sno: 124, taluka: "Purandhar", village: "Pargaon", type: "EW", lon: 74.125, lat: 18.3583, depthM: 153.2, preSwlM: 14.0, postSwlM: 5.6, yieldLps: null, yieldRaw: "-", aq1BottomM: 18.0, aq2BottomM: 90.0, aq2ThickM: 1.0, zones: "18 - ,70 - 14 5.6" },
  { sno: 125, taluka: "Purandhar", village: "Rakh", type: "EW", lon: 74.2133, lat: 18.2056, depthM: 200.0, preSwlM: 45.0, postSwlM: 21.0, yieldLps: 0.78, yieldRaw: "0.78", aq1BottomM: 28.0, aq2BottomM: 127.0, aq2ThickM: 2.0, zones: "28.70, 45 21 127.00" },
  { sno: 126, taluka: "Purandhar", village: "Sasvad", type: "EW", lon: 74.025, lat: 18.3347, depthM: 200.0, preSwlM: 16.0, postSwlM: 8.0, yieldLps: 2.34, yieldRaw: "2.34", aq1BottomM: 27.0, aq2BottomM: 94.0, aq2ThickM: 4.0, zones: "27 -37 ,61 - 16 8" },
  { sno: 127, taluka: "Purandhar", village: "Singapur", type: "EW", lon: 74.1194, lat: 18.3861, depthM: 200.0, preSwlM: 12.0, postSwlM: 1.5, yieldLps: null, yieldRaw: "-", aq1BottomM: 25.0, aq2BottomM: 135.0, aq2ThickM: 1.0, zones: "12 1.5" },
  { sno: 128, taluka: "Purandhar", village: "Waghapur", type: "EW", lon: 74.1297, lat: 18.3992, depthM: 73.2, preSwlM: 30.0, postSwlM: 21.0, yieldLps: 2.34, yieldRaw: "2.34", aq1BottomM: 20.0, aq2BottomM: 70.0, aq2ThickM: 3.0, zones: "35 - ,45 - 30 21" },
  { sno: 129, taluka: "Purandhar", village: "Walhe", type: "EW", lon: 74.1569, lat: 18.1853, depthM: 200.0, preSwlM: 21.0, postSwlM: 12.3, yieldLps: 0.38, yieldRaw: "0.38", aq1BottomM: 19.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "19 21 12.3" },
  { sno: 130, taluka: "Shirur", village: "Dingrajwadi", type: "EW", lon: 74.0883, lat: 18.635, depthM: 75.8, preSwlM: 12.0, postSwlM: 1.85, yieldLps: 4.76, yieldRaw: "4.76", aq1BottomM: 20.0, aq2BottomM: 70.0, aq2ThickM: 6.0, zones: "7.8 - ,13.5 - 12 1.85" },
  { sno: 131, taluka: "Shirur", village: "Dingrajwadi", type: "OW", lon: 74.0883, lat: 18.635, depthM: 200.0, preSwlM: 12.0, postSwlM: 1.85, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 125.0, aq2ThickM: 6.0, zones: "7.8 - ,13.5 - 12 1.85" },
  { sno: 132, taluka: "Shirur", village: "Kavthe", type: "EW", lon: 74.1806, lat: 18.8889, depthM: 200.0, preSwlM: 11.0, postSwlM: 1.8, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 135.0, aq2ThickM: 1.0, zones: "11 1.8" },
  { sno: 133, taluka: "Shirur", village: "Khairewadi", type: "EW", lon: 74.13297, lat: 18.79341, depthM: 200.0, preSwlM: 120.0, postSwlM: 50.0, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 15.0, aq2BottomM: 100.0, aq2ThickM: 0.5, zones: "I-35.1-38.2, 120 50 7 II-87.00- 90.00" },
  { sno: 134, taluka: "Shirur", village: "Nimone", type: "EW", lon: 74.40437, lat: 18.7093, depthM: 177.5, preSwlM: 20.0, postSwlM: 9.9, yieldLps: 43.85, yieldRaw: "43.85", aq1BottomM: 10.0, aq2BottomM: 180.0, aq2ThickM: 7.0, zones: "I-105.30- 20 9.9 8 9 108.30, II- 111.40- 114.40, III- 129.70- 132.70, " },
  { sno: 135, taluka: "Shirur", village: "Nimone", type: "OW", lon: 74.40429, lat: 18.70921, depthM: 200.0, preSwlM: 20.0, postSwlM: 20.1, yieldLps: 1.38, yieldRaw: "1.38", aq1BottomM: 10.0, aq2BottomM: 140.0, aq2ThickM: 1.0, zones: "I-41.20- 20 20.1 1 44.30, II- 47.30- 50.40, III- 126.60- 129.70" },
  { sno: 136, taluka: "Shirur", village: "Nirvi", type: "EW", lon: 74.425, lat: 18.65, depthM: 200.0, preSwlM: 60.0, postSwlM: 35.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 20.0, aq2BottomM: 108.0, aq2ThickM: 2.0, zones: "-108 60 35" },
  { sno: 137, taluka: "Shirur", village: "Pabal", type: "EW", lon: 74.0639, lat: 18.6819, depthM: 201.5, preSwlM: 13.0, postSwlM: 1.8, yieldLps: null, yieldRaw: "-", aq1BottomM: 21.0, aq2BottomM: 125.0, aq2ThickM: 1.0, zones: "13 1.8" },
  { sno: 138, taluka: "Shirur", village: "Pimple Jagtap", type: "EW", lon: 74.0806, lat: 18.7111, depthM: 200.0, preSwlM: 14.0, postSwlM: 2.87, yieldLps: 3.4, yieldRaw: "3.4", aq1BottomM: 18.0, aq2BottomM: 152.0, aq2ThickM: 9.0, zones: "8 -18 ,46 - 14 2.87 49 ,161 - 168 ,146 - 152" },
  { sno: 139, taluka: "Shirur", village: "Ranjangaon", type: "EW", lon: 74.2492, lat: 18.7514, depthM: 200.0, preSwlM: 18.0, postSwlM: 9.0, yieldLps: 3.4, yieldRaw: "3.4", aq1BottomM: 20.0, aq2BottomM: 149.0, aq2ThickM: 9.0, zones: "6.4 -13 ,79 18 9 -85 ,161 - 171 ,143 - 149" },
  { sno: 140, taluka: "Shirur", village: "Ranjangaon", type: "OW", lon: 74.2492, lat: 18.7514, depthM: 171.1, preSwlM: 18.0, postSwlM: 9.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 25.0, aq2BottomM: 171.0, aq2ThickM: 9.0, zones: "79 -85 ,161 18 9 -171" },
  { sno: 141, taluka: "Velhe", village: "Khanapur", type: "EW", lon: 73.8578, lat: 18.1049, depthM: 200.0, preSwlM: 22.58, postSwlM: 13.0, yieldLps: 1.14, yieldRaw: "1.14", aq1BottomM: 30.0, aq2BottomM: 135.0, aq2ThickM: 3.0, zones: "-30 22.58 13" },
  { sno: 142, taluka: "Velhe", village: "Kotawdi", type: "EW", lon: 73.7642, lat: 18.3014, depthM: 200.0, preSwlM: 36.5, postSwlM: 16.0, yieldLps: 0.85, yieldRaw: "0.85", aq1BottomM: 13.0, aq2BottomM: 95.0, aq2ThickM: 2.0, zones: "13 - ,95 - 36.5 16" },
  { sno: 143, taluka: "Velhe", village: "Kotawdi", type: "OW", lon: 73.7642, lat: 18.3014, depthM: 110.8, preSwlM: 36.5, postSwlM: 16.0, yieldLps: 1.5, yieldRaw: "1.5", aq1BottomM: 13.0, aq2BottomM: 83.0, aq2ThickM: 2.0, zones: "-83 36.5 16" },
  { sno: 144, taluka: "Velhe", village: "Velhe", type: "EW", lon: 73.6405, lat: 18.29786, depthM: 200.0, preSwlM: 120.0, postSwlM: 110.0, yieldLps: 0.05, yieldRaw: "meager", aq1BottomM: 20.0, aq2BottomM: 120.0, aq2ThickM: 0.5, zones: "Seepage at 120 110 1 16.80mbgl, Water Zone I- 59.50 - 60.50 mbgl,Water" },
  { sno: 145, taluka: "Velhe", village: "Winzer", type: "EW", lon: 73.7221, lat: 18.3061, depthM: 200.0, preSwlM: 50.0, postSwlM: 35.0, yieldLps: 0.62, yieldRaw: "0.62", aq1BottomM: 13.0, aq2BottomM: 84.0, aq2ThickM: 2.0, zones: "8.5 - ,84 - 50 35" },
  { sno: 146, taluka: "Velhe", village: "Winzer", type: "OW", lon: 73.7213, lat: 18.3064, depthM: 30.0, preSwlM: 50.0, postSwlM: 35.0, yieldLps: null, yieldRaw: "-", aq1BottomM: 13.0, aq2BottomM: 30.0, aq2ThickM: 1.0, zones: "-8 50 35" },
]

/** Success threshold used for modelling: pump-tested yield ≥ 1.0. */
export const SUCCESS_YIELD_LPS = 1.0

export const testedWells = (): CgwbWell[] => CGWB_WELLS.filter((w) => w.yieldLps !== null)

export const wellOutcome = (w: CgwbWell): 0 | 1 | null =>
  w.yieldLps === null ? null : w.yieldLps >= SUCCESS_YIELD_LPS ? 1 : 0

export const wellsInTaluka = (taluka: string): CgwbWell[] =>
  CGWB_WELLS.filter((w) => w.taluka === taluka)

/** Wells with usable coordinates (for the map + nearest-well search). */
export const locatedWells = (): CgwbWell[] =>
  CGWB_WELLS.filter((w) => w.lat !== null && w.lon !== null)

/** Great-circle distance in km (equirectangular approximation, fine at district scale). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180
  const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad)
  const y = (lat2 - lat1) * rad
  return Math.round(Math.sqrt(x * x + y * y) * 6371 * 10) / 10
}

export function nearestWells(lat: number, lon: number, n = 5): { well: CgwbWell; km: number }[] {
  return locatedWells()
    .map((well) => ({ well, km: distanceKm(lat, lon, well.lat!, well.lon!) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
}
