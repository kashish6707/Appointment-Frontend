// Sample data for the patient pages: fictional clinics and doctors (no real people), used when
// NEXT_PUBLIC_USE_SAMPLE_DATA=true, and for states and districts the backend doesn't cover yet.
// Shapes match the backend's /api/public responses (see lib/patientApi.ts).

import type { Area, ClinicCard, ClinicDetails, Department, District, DoctorCard, State } from "./patientApi";

export const sampleDepartments: Department[] = [
  { key: "general_medicine", nameEn: "General physician", nameHi: "सामान्य चिकित्सक", iconKey: "stethoscope" },
  { key: "gastroenterology", nameEn: "Gastroenterology", nameHi: "पेट रोग", iconKey: "stomach" },
  { key: "gynaecology", nameEn: "Gynaecology", nameHi: "स्त्री रोग", iconKey: "female" },
  { key: "orthopaedics", nameEn: "Orthopaedics", nameHi: "हड्डी रोग", iconKey: "bone" },
  { key: "paediatrics", nameEn: "Paediatrics", nameHi: "शिशु रोग", iconKey: "baby" },
  { key: "dermatology", nameEn: "Dermatology", nameHi: "त्वचा रोग", iconKey: "skin" },
  { key: "ophthalmology", nameEn: "Eye", nameHi: "नेत्र रोग", iconKey: "eye" },
  { key: "cardiology", nameEn: "Cardiology", nameHi: "हृदय रोग", iconKey: "heart" },
  { key: "ent", nameEn: "ENT", nameHi: "नाक, कान, गला", iconKey: "ear" },
  { key: "dentistry", nameEn: "Dental", nameHi: "दंत रोग", iconKey: "tooth" },
];

export const sampleStates: State[] = [
  { id: "bihar", name: "Bihar", nameHi: "बिहार" },
  { id: "jharkhand", name: "Jharkhand", nameHi: "झारखंड" },
  { id: "uttar_pradesh", name: "Uttar Pradesh", nameHi: "उत्तर प्रदेश" },
];

export const sampleDistricts: District[] = [
  { id: "patna", stateId: "bihar", name: "Patna", nameHi: "पटना" },
  { id: "gaya", stateId: "bihar", name: "Gaya", nameHi: "गया" },
  { id: "muzaffarpur", stateId: "bihar", name: "Muzaffarpur", nameHi: "मुज़फ़्फ़रपुर" },
  { id: "bhagalpur", stateId: "bihar", name: "Bhagalpur", nameHi: "भागलपुर" },
  { id: "ranchi", stateId: "jharkhand", name: "Ranchi", nameHi: "रांची" },
  { id: "dhanbad", stateId: "jharkhand", name: "Dhanbad", nameHi: "धनबाद" },
  { id: "varanasi", stateId: "uttar_pradesh", name: "Varanasi", nameHi: "वाराणसी" },
  { id: "lucknow", stateId: "uttar_pradesh", name: "Lucknow", nameHi: "लखनऊ" },
];

export const sampleAreas: Area[] = [
  { id: "kankarbagh", districtId: "patna", name: "Kankarbagh", nameHi: "कंकड़बाग", doctorCount: 18, lat: 25.599, lng: 85.16 },
  { id: "boring_road", districtId: "patna", name: "Boring Road", nameHi: "बोरिंग रोड", doctorCount: 24, lat: 25.6153, lng: 85.1124 },
  { id: "rajendra_nagar", districtId: "patna", name: "Rajendra Nagar", nameHi: "राजेंद्र नगर", doctorCount: 11, lat: 25.6046, lng: 85.1596 },
  { id: "ashok_rajpath", districtId: "patna", name: "Ashok Rajpath", nameHi: "अशोक राजपथ", doctorCount: 15, lat: 25.62, lng: 85.17 },
  { id: "bailey_road", districtId: "patna", name: "Bailey Road", nameHi: "बेली रोड", doctorCount: 9, lat: 25.608, lng: 85.09 },
  { id: "patna_city", districtId: "patna", name: "Patna City", nameHi: "पटना सिटी", doctorCount: 7, lat: 25.596, lng: 85.228 },
  { id: "danapur", districtId: "patna", name: "Danapur", nameHi: "दानापुर", doctorCount: 6, lat: 25.62, lng: 85.045 },
  { id: "gaya_town", districtId: "gaya", name: "Gaya Town", nameHi: "गया शहर", doctorCount: 8, lat: 24.7955, lng: 85.0002 },
  { id: "bodh_gaya", districtId: "gaya", name: "Bodh Gaya", nameHi: "बोधगया", doctorCount: 3, lat: 24.6961, lng: 84.9869 },
  { id: "brahmpura", districtId: "muzaffarpur", name: "Brahmpura", nameHi: "ब्रह्मपुरा", doctorCount: 5, lat: 26.12, lng: 85.39 },
  { id: "tilkamanjhi", districtId: "bhagalpur", name: "Tilkamanjhi", nameHi: "तिलकामांझी", doctorCount: 4, lat: 25.25, lng: 86.98 },
  { id: "lalpur", districtId: "ranchi", name: "Lalpur", nameHi: "लालपुर", doctorCount: 6, lat: 23.37, lng: 85.33 },
  { id: "bank_more", districtId: "dhanbad", name: "Bank More", nameHi: "बैंक मोड़", doctorCount: 4, lat: 23.79, lng: 86.43 },
  { id: "lanka", districtId: "varanasi", name: "Lanka", nameHi: "लंका", doctorCount: 9, lat: 25.28, lng: 83.0 },
  { id: "hazratganj", districtId: "lucknow", name: "Hazratganj", nameHi: "हज़रतगंज", doctorCount: 12, lat: 26.85, lng: 80.95 },
];

// --- clinics and doctors (all fictional) -----------------------------------------------------

type SampleDoctor = Omit<DoctorCard, "id" | "doctorClinicId" | "initials" | "photoUrl" | "opdStatus" | "opensAt"> & { key: string };

type SampleClinic = Omit<ClinicCard, "doctors" | "doctorCount" | "departmentCount" | "departmentKeys" | "summary" | "coverPhotoUrl"> & {
  phone: string;
  opdHoursTextEn: string;
  opdHoursTextHi: string;
  lat: number;
  lng: number;
  doctors: SampleDoctor[];
};

const doctor = (key: string, name: string, departmentKey: string, designation: string, degree: string, experienceYears: number, fee: number, regNo: string, waitingToday: number | null): SampleDoctor => ({
  key,
  name,
  nameHi: null,
  department: sampleDepartments.find((d) => d.key === departmentKey)?.nameEn ?? null,
  departmentKey,
  designation,
  degree,
  experienceYears,
  fee,
  registrationNo: regNo,
  waitingToday,
});

const clinics: SampleClinic[] = [
  {
    id: "sanjeevani", name: "Sanjeevani Clinic", nameHi: "संजीवनी क्लिनिक", type: "CLINIC", coverColour: "#1F7A55",
    address: "12, Main Road, Kankarbagh, Patna 800020", areaName: "Kankarbagh", distanceKm: 0.8, lat: 25.6, lng: 85.158,
    opdStatus: "OPEN_NOW", opensAt: null, waitingNow: 9, phone: "9800000001",
    opdHoursTextEn: "Mon–Sat, 10 am – 2 pm and 5 – 8 pm", opdHoursTextHi: "सोम–शनि, सुबह 10 – दोपहर 2 और शाम 5 – 8",
    doctors: [
      doctor("d-anil", "Dr. Anil Prakash", "general_medicine", "Senior Physician", "MBBS, MD (Medicine)", 16, 400, "BCMR-18234", 6),
      doctor("d-sushma", "Dr. Sushma Kumari", "gynaecology", "Consultant Gynaecologist", "MBBS, MS (Obs & Gynae)", 11, 500, "BCMR-18871", 3),
    ],
  },
  {
    id: "arogya", name: "Arogya Multispeciality Hospital", nameHi: "आरोग्य मल्टीस्पेशलिटी अस्पताल", type: "HOSPITAL", coverColour: "#145C3F",
    address: "Near Rajendra Nagar Terminal, Patna 800016", areaName: "Rajendra Nagar", distanceKm: 1.6, lat: 25.6046, lng: 85.1596,
    opdStatus: "OPEN_NOW", opensAt: null, waitingNow: 23, phone: "9800000002",
    opdHoursTextEn: "Mon–Sun, 9 am – 4 pm", opdHoursTextHi: "सोम–रवि, सुबह 9 – शाम 4",
    doctors: [
      doctor("d-rakesh", "Dr. Rakesh Ranjan", "cardiology", "Director & HOD, Cardiology", "MBBS, MD, DM (Cardiology)", 22, 800, "BCMR-18045", 7),
      doctor("d-neha", "Dr. Neha Sinha", "orthopaedics", "Senior Consultant, Orthopaedics", "MBBS, MS (Ortho)", 12, 600, "BCMR-18560", 5),
      doctor("d-vikram", "Dr. Vikram Singh", "gastroenterology", "Consultant Gastroenterologist", "MBBS, MD, DM (Gastro)", 9, 700, "BCMR-18912", 4),
      doctor("d-pooja", "Dr. Pooja Bharti", "paediatrics", "Consultant Paediatrician", "MBBS, MD (Paediatrics)", 8, 500, "BCMR-18733", 3),
      doctor("d-sameer", "Dr. Sameer Alam", "ent", "ENT Surgeon", "MBBS, MS (ENT)", 14, 500, "BCMR-18402", 2),
      doctor("d-kavya", "Dr. Kavya Mishra", "dermatology", "Consultant Dermatologist", "MBBS, MD (Dermatology)", 6, 600, "BCMR-18998", 2),
    ],
  },
  {
    id: "patliputra-bone", name: "Patliputra Bone & Joint Clinic", nameHi: "पाटलिपुत्र हड्डी व जोड़ क्लिनिक", type: "CLINIC", coverColour: "#2D6A9F",
    address: "Shop 4, Boring Road Crossing, Patna 800001", areaName: "Boring Road", distanceKm: 3.2, lat: 25.6153, lng: 85.1124,
    opdStatus: "OPENS_LATER", opensAt: "17:00", waitingNow: 0, phone: "9800000003",
    opdHoursTextEn: "Mon–Sat, 5 – 9 pm", opdHoursTextHi: "सोम–शनि, शाम 5 – रात 9",
    doctors: [doctor("d-manish", "Dr. Manish Verma", "orthopaedics", "Joint Replacement Surgeon", "MBBS, MS (Ortho), Fellowship in Arthroplasty", 15, 700, "BCMR-18311", null)],
  },
  {
    id: "little-steps", name: "Little Steps Child Clinic", nameHi: "लिटिल स्टेप्स शिशु क्लिनिक", type: "CLINIC", coverColour: "#C77D12",
    address: "Ashok Rajpath, near Science College, Patna 800004", areaName: "Ashok Rajpath", distanceKm: 3.9, lat: 25.62, lng: 85.17,
    opdStatus: "OPEN_NOW", opensAt: null, waitingNow: 5, phone: "9800000004",
    opdHoursTextEn: "Mon–Sat, 11 am – 3 pm", opdHoursTextHi: "सोम–शनि, सुबह 11 – दोपहर 3",
    doctors: [
      doctor("d-ritu", "Dr. Ritu Anand", "paediatrics", "Child Specialist", "MBBS, DCH", 10, 400, "BCMR-18620", 5),
      doctor("d-farhan", "Dr. Farhan Khan", "paediatrics", "Consultant Neonatologist", "MBBS, MD (Paediatrics)", 7, 500, "BCMR-18877", 0),
    ],
  },
  {
    id: "ganga-heart", name: "Ganga Heart Hospital", nameHi: "गंगा हृदय अस्पताल", type: "HOSPITAL", coverColour: "#B9382A",
    address: "Bailey Road, Patna 800014", areaName: "Bailey Road", distanceKm: 6.1, lat: 25.608, lng: 85.09,
    opdStatus: "CLOSED_TODAY", opensAt: null, waitingNow: 0, phone: "9800000005",
    opdHoursTextEn: "Mon–Fri, 9 am – 1 pm", opdHoursTextHi: "सोम–शुक्र, सुबह 9 – दोपहर 1",
    doctors: [
      doctor("d-alok", "Dr. Alok Kumar", "cardiology", "Senior Interventional Cardiologist", "MBBS, MD, DM (Cardiology)", 19, 900, "BCMR-18120", null),
      doctor("d-shalini", "Dr. Shalini Rai", "general_medicine", "Consultant Physician", "MBBS, MD (Medicine)", 9, 500, "BCMR-18688", null),
      doctor("d-harsh", "Dr. Harsh Vardhan", "cardiology", "Consultant Cardiologist", "MBBS, MD, DNB (Cardiology)", 8, 700, "BCMR-18901", null),
    ],
  },
  {
    id: "nayan-eye", name: "Nayan Eye Care", nameHi: "नयन नेत्र केंद्र", type: "CLINIC", coverColour: "#5B4BA0",
    address: "Patna City, near Chowk, Patna 800008", areaName: "Patna City", distanceKm: 7.4, lat: 25.596, lng: 85.228,
    opdStatus: "OPENS_LATER", opensAt: "16:00", waitingNow: 0, phone: "9800000006",
    opdHoursTextEn: "Mon–Sat, 4 – 8 pm", opdHoursTextHi: "सोम–शनि, शाम 4 – रात 8",
    doctors: [doctor("d-meenakshi", "Dr. Meenakshi Jha", "ophthalmology", "Eye Surgeon", "MBBS, MS (Ophthalmology)", 13, 500, "BCMR-18455", null)],
  },
  {
    id: "muskaan-dental", name: "Muskaan Dental Clinic", nameHi: "मुस्कान डेंटल क्लिनिक", type: "CLINIC", coverColour: "#2C8C99",
    address: "Danapur Cantt Road, Patna 801503", areaName: "Danapur", distanceKm: 11.8, lat: 25.62, lng: 85.045,
    opdStatus: "OPEN_NOW", opensAt: null, waitingNow: 2, phone: "9800000007",
    opdHoursTextEn: "Mon–Sat, 10 am – 7 pm", opdHoursTextHi: "सोम–शनि, सुबह 10 – शाम 7",
    doctors: [doctor("d-ankita", "Dr. Ankita Raj", "dentistry", "Dental Surgeon", "BDS, MDS (Endodontics)", 7, 300, "BCMR-D-18233", 2)],
  },
];

// --- shaping into the API's form ------------------------------------------------------------

function initials(name: string) {
  const words = name.replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function toDoctorCard(c: SampleClinic, d: SampleDoctor): DoctorCard {
  const { key, ...rest } = d;
  return {
    ...rest,
    id: key,
    doctorClinicId: `${c.id}--${key}`,
    initials: initials(d.name),
    photoUrl: null, // no real people's photos: the app shows initials
    opdStatus: c.opdStatus,
    opensAt: c.opensAt,
    waitingToday: c.opdStatus === "OPEN_NOW" ? d.waitingToday : null,
  };
}

function departmentKeys(c: SampleClinic) {
  const found = new Set(c.doctors.map((d) => d.departmentKey));
  return sampleDepartments.map((d) => d.key).filter((k) => found.has(k));
}

function summary(c: SampleClinic) {
  const names = departmentKeys(c).map((k) => sampleDepartments.find((d) => d.key === k)!.nameEn);
  const shown = names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2} more` : "");
  return `${c.doctors.length} doctor${c.doctors.length === 1 ? "" : "s"}${shown ? `, ${shown}` : ""}`;
}

export function sampleClinicCards(): ClinicCard[] {
  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    nameHi: c.nameHi,
    type: c.type,
    coverPhotoUrl: null,
    coverColour: c.coverColour,
    address: c.address,
    areaName: c.areaName,
    distanceKm: c.distanceKm,
    doctorCount: c.doctors.length,
    departmentCount: departmentKeys(c).length,
    departmentKeys: departmentKeys(c),
    summary: summary(c),
    opdStatus: c.opdStatus,
    opensAt: c.opensAt,
    waitingNow: c.waitingNow,
    doctors: c.doctors.slice(0, 5).map((d) => toDoctorCard(c, d)),
  }));
}

export function sampleClinicDetails(id: string): ClinicDetails | null {
  const c = clinics.find((x) => x.id === id);
  if (!c) return null;
  return {
    id: c.id,
    type: c.type,
    name: c.name,
    nameHi: c.nameHi,
    address: c.address,
    areaName: c.areaName,
    lat: c.lat,
    lng: c.lng,
    locationIsApproximate: false,
    phone: c.phone,
    opdHoursTextEn: c.opdHoursTextEn,
    opdHoursTextHi: c.opdHoursTextHi,
    coverPhoto: null,
    coverColour: c.coverColour,
    photos: [],
    opdStatus: c.opdStatus,
    opensAt: c.opensAt,
    waitingNow: c.waitingNow,
    departments: sampleDepartments.filter((d) => departmentKeys(c).includes(d.key)),
    doctorCount: c.doctors.length,
  };
}

export function sampleClinicDoctors(id: string): DoctorCard[] {
  const c = clinics.find((x) => x.id === id);
  return c ? c.doctors.map((d) => toDoctorCard(c, d)) : [];
}
