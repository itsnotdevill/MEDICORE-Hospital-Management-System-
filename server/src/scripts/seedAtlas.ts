import 'dotenv/config';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { Consultation } from '../models/Consultation';
import { Invoice } from '../models/Invoice';
import { AuditLog } from '../models/AuditLog';
import { HospitalService } from '../models/HospitalService';
import { PharmacyItem } from '../models/PharmacyItem';
import { WardBed } from '../models/WardBed';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in restricted environments
}

async function seedAtlas() {
  const rawUri = process.env.MONGODB_URI || '';
  const uri = rawUri.replace(/:<([^>]+)>/, ':$1');

  if (!uri || !uri.includes('mongodb+srv')) {
    console.error('❌ MONGODB_URI in server/.env is not a valid MongoDB Atlas SRV URI.');
    console.error('Please configure your MongoDB Atlas cluster URI in server/.env');
    process.exit(1);
  }

  const maskedUri = uri.replace(/:[^:@]*@/, ':****@');
  console.log(`🌐 Connecting to MongoDB Atlas Cloud Cluster: ${maskedUri}...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ Successfully authenticated and connected to MongoDB Atlas!`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (err: any) {
    console.error('\n❌ MongoDB Atlas Authentication Failed:');
    console.error(`Error details: ${err.message}\n`);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('👉 HOW TO RESOLVE THIS IN MONGODB ATLAS IN 1 MINUTE:');
    console.error(' 1. Go to your MongoDB Atlas dashboard (open in your browser).');
    console.error(' 2. On the left sidebar under "SECURITY", click "Database Access".');
    console.error(' 3. Click "Add New Database User" (green button).');
    console.error(' 4. Select "Password" as Authentication Method.');
    console.error(' 5. Set Username matching your MONGODB_URI (e.g. medicore_db)');
    console.error(' 6. Set Password matching your MONGODB_URI in server/.env');
    console.error(' 7. Under "Database User Privileges", select "Read and write to any database" (or "Atlas admin").');
    console.error(' 8. Click "Add User" at the bottom.');
    console.error(' 9. Also verify under "SECURITY" -> "Network Access" that IP 0.0.0.0/0 (Allow access from anywhere) is active.');
    console.error(' 10. Run "npm run seed:atlas" again!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }

  console.log('\n🚀 Starting full seed of 11 collections to MongoDB Atlas...\n');

  // Clear existing collections in Atlas
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Consultation.deleteMany({}),
    Invoice.deleteMany({}),
    AuditLog.deleteMany({}),
    HospitalService.deleteMany({}),
    PharmacyItem.deleteMany({}),
    WardBed.deleteMany({}),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // 1. Users
  const [admin, reception, drUser, billing, drSingh, drPatel, drMehta] = await Promise.all([
    User.create({
      name: 'Admin User',
      email: 'admin@medicore.dev',
      passwordHash: await hash('Admin@12345'),
      role: 'ADMIN',
      phone: '+91 98000 00001',
      isActive: true,
    }),
    User.create({
      name: 'Priya Sharma (Reception)',
      email: 'reception@medicore.dev',
      passwordHash: await hash('Reception@12345'),
      role: 'RECEPTIONIST',
      phone: '+91 98000 00002',
      isActive: true,
    }),
    User.create({
      name: 'Dr. Arjun Sharma',
      email: 'dr.sharma@medicore.dev',
      passwordHash: await hash('Doctor@12345'),
      role: 'DOCTOR',
      phone: '+91 98000 00003',
      isActive: true,
    }),
    User.create({
      name: 'Rahul Mehta (Billing)',
      email: 'billing@medicore.dev',
      passwordHash: await hash('Billing@12345'),
      role: 'BILLING_STAFF',
      phone: '+91 98000 00004',
      isActive: true,
    }),
    User.create({
      name: 'Dr. Kavya Singh',
      email: 'dr.singh@medicore.dev',
      passwordHash: await hash('Doctor@12345'),
      role: 'DOCTOR',
      phone: '+91 98000 00005',
      isActive: true,
    }),
    User.create({
      name: 'Dr. Ravi Patel',
      email: 'dr.patel@medicore.dev',
      passwordHash: await hash('Doctor@12345'),
      role: 'DOCTOR',
      phone: '+91 98000 00006',
      isActive: true,
    }),
    User.create({
      name: 'Dr. Ananya Mehta',
      email: 'dr.mehta@medicore.dev',
      passwordHash: await hash('Doctor@12345'),
      role: 'DOCTOR',
      phone: '+91 98000 00007',
      isActive: true,
    }),
  ]);

  // 2. Departments
  const [cardiology, orthopedics, neurology, pediatrics, emergencyDept, oncology] = await Promise.all([
    Department.create({
      name: 'Cardiology',
      description: 'Comprehensive diagnosis and treatment of cardiovascular diseases and heart surgeries.',
      headDoctorId: drUser._id,
      isActive: true,
    }),
    Department.create({
      name: 'Orthopedics & Joint Care',
      description: 'Bone, joint, spine, and complex musculoskeletal trauma care.',
      headDoctorId: drSingh._id,
      isActive: true,
    }),
    Department.create({
      name: 'Neurology & Neurosurgery',
      description: 'Brain, nervous system, epilepsy, stroke, and spinal interventions.',
      headDoctorId: drPatel._id,
      isActive: true,
    }),
    Department.create({
      name: 'Pediatrics & Neonatal Care',
      description: 'Dedicated clinical care for infants, children, and adolescents.',
      headDoctorId: drMehta._id,
      isActive: true,
    }),
    Department.create({
      name: 'Emergency & Trauma Care',
      description: '24/7 Level-1 trauma and critical acute care unit.',
      isActive: true,
    }),
    Department.create({
      name: 'Oncology',
      description: 'Medical, surgical, and radiation oncology treatments.',
      isActive: true,
    }),
  ]);

  // 3. Doctors
  await Promise.all([
    Doctor.create({
      userId: drUser._id,
      departmentId: cardiology._id,
      specialization: 'Interventional Cardiology & Angioplasty',
      qualification: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
      experience: 14,
      consultationFee: 800,
      schedule: [
        { day: 'MON', startTime: '09:00', endTime: '13:00' },
        { day: 'WED', startTime: '09:00', endTime: '13:00' },
        { day: 'FRI', startTime: '14:00', endTime: '18:00' },
      ],
      bio: 'Senior consultant cardiologist with over 14 years of clinical expertise in coronary interventions.',
    }),
    Doctor.create({
      userId: drSingh._id,
      departmentId: orthopedics._id,
      specialization: 'Joint Replacement & Arthroscopic Surgery',
      qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho)',
      experience: 10,
      consultationFee: 700,
      schedule: [
        { day: 'TUE', startTime: '10:00', endTime: '14:00' },
        { day: 'THU', startTime: '10:00', endTime: '14:00' },
        { day: 'SAT', startTime: '09:00', endTime: '13:00' },
      ],
      bio: 'Specialist in minimally invasive total knee and hip replacement procedures.',
    }),
    Doctor.create({
      userId: drPatel._id,
      departmentId: neurology._id,
      specialization: 'Cognitive Disorders & Epilepsy',
      qualification: 'MBBS, MD, DM (Neurology)',
      experience: 16,
      consultationFee: 1000,
      schedule: [
        { day: 'MON', startTime: '14:00', endTime: '18:00' },
        { day: 'WED', startTime: '14:00', endTime: '18:00' },
        { day: 'FRI', startTime: '09:00', endTime: '13:00' },
      ],
      bio: 'Head of Neurology specializing in neuro-electrophysiology and neuro-rehabilitation.',
    }),
    Doctor.create({
      userId: drMehta._id,
      departmentId: pediatrics._id,
      specialization: 'General Pediatrics & Child Immunization',
      qualification: 'MBBS, DCH, MD (Pediatrics)',
      experience: 8,
      consultationFee: 600,
      schedule: [
        { day: 'MON', startTime: '10:00', endTime: '14:00' },
        { day: 'TUE', startTime: '10:00', endTime: '14:00' },
        { day: 'THU', startTime: '10:00', endTime: '14:00' },
        { day: 'FRI', startTime: '10:00', endTime: '14:00' },
      ],
      bio: 'Dedicated pediatrician focused on developmental milestones and pediatric wellness.',
    }),
  ]);

  // 4. Patients
  const patientData = [
    {
      patientId: 'P-00001',
      name: 'Amit Kumar',
      dob: new Date('1984-03-15'),
      gender: 'MALE',
      phone: '+91 98111 22334',
      email: 'amit.kumar@example.com',
      address: 'Flat 402, Green Valley Apartments, Mumbai - 400001',
      bloodGroup: 'O+',
      allergies: ['Penicillin'],
      emergencyContact: { name: 'Sunita Kumar', phone: '+91 98111 22335', relation: 'Spouse' },
      registeredBy: reception._id,
      isActive: true,
    },
    {
      patientId: 'P-00002',
      name: 'Sunita Verma',
      dob: new Date('1992-07-22'),
      gender: 'FEMALE',
      phone: '+91 98222 33445',
      email: 'sunita.v@example.com',
      address: '15, Lotus Enclave, Koregaon Park, Pune - 411001',
      bloodGroup: 'A+',
      allergies: [],
      emergencyContact: { name: 'Rajesh Verma', phone: '+91 98222 33446', relation: 'Spouse' },
      registeredBy: reception._id,
      isActive: true,
    },
    {
      patientId: 'P-00003',
      name: 'Ravi Shankar',
      dob: new Date('1976-11-08'),
      gender: 'MALE',
      phone: '+91 98333 44556',
      email: 'ravi.shankar@example.com',
      address: '88, Anna Nagar West, Chennai - 600040',
      bloodGroup: 'B+',
      allergies: ['Sulfa drugs', 'Aspirin'],
      emergencyContact: { name: 'Meena Shankar', phone: '+91 98333 44557', relation: 'Wife' },
      registeredBy: admin._id,
      isActive: true,
    },
    {
      patientId: 'P-00004',
      name: 'Deepa Nair',
      dob: new Date('2001-05-18'),
      gender: 'FEMALE',
      phone: '+91 98444 55667',
      email: 'deepa.nair@example.com',
      address: '23/B, Marine Drive, Kochi - 682019',
      bloodGroup: 'AB-',
      allergies: [],
      emergencyContact: { name: 'Sreedharan Nair', phone: '+91 98444 55668', relation: 'Father' },
      registeredBy: reception._id,
      isActive: true,
    },
    {
      patientId: 'P-00005',
      name: 'Mohammed Farhan',
      dob: new Date('1965-09-30'),
      gender: 'MALE',
      phone: '+91 98555 66778',
      email: 'm.farhan@example.com',
      address: '56, Road No. 10, Jubilee Hills, Hyderabad - 500033',
      bloodGroup: 'A-',
      allergies: ['NSAIDs', 'Ibuprofen'],
      emergencyContact: { name: 'Fatima Farhan', phone: '+91 98555 66779', relation: 'Wife' },
      registeredBy: reception._id,
      isActive: true,
    },
  ];

  const patients = [];
  for (const p of patientData) {
    const created = await Patient.create(p);
    patients.push(created);
  }

  // 5. Appointments
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const appointmentsData = [
    {
      appointmentId: 'A-00001',
      patientId: patients[0]._id,
      doctorId: drUser._id,
      departmentId: cardiology._id,
      date: today,
      timeSlot: '10:00',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      notes: 'Patient complains of exertion chest discomfort and mild palpitation.',
      createdBy: reception._id,
    },
    {
      appointmentId: 'A-00002',
      patientId: patients[1]._id,
      doctorId: drSingh._id,
      departmentId: orthopedics._id,
      date: today,
      timeSlot: '11:00',
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      notes: 'Post-cast removal mobility review for right distal radius.',
      createdBy: reception._id,
    },
    {
      appointmentId: 'A-00003',
      patientId: patients[2]._id,
      doctorId: drPatel._id,
      departmentId: neurology._id,
      date: yesterday,
      timeSlot: '14:00',
      type: 'CONSULTATION',
      status: 'COMPLETED',
      notes: 'Frequent migraine episodes with visual scintillations.',
      createdBy: reception._id,
    },
    {
      appointmentId: 'A-00004',
      patientId: patients[3]._id,
      doctorId: drUser._id,
      departmentId: cardiology._id,
      date: tomorrow,
      timeSlot: '09:00',
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      notes: 'Routine executive heart check-up and lipid review.',
      createdBy: admin._id,
    },
    {
      appointmentId: 'A-00005',
      patientId: patients[4]._id,
      doctorId: drSingh._id,
      departmentId: orthopedics._id,
      date: yesterday,
      timeSlot: '10:00',
      type: 'EMERGENCY',
      status: 'COMPLETED',
      notes: 'Acute right knee trauma after slip on wet steps.',
      createdBy: reception._id,
    },
  ];

  const appointments = [];
  for (const a of appointmentsData) {
    const created = await Appointment.create(a);
    appointments.push(created);
  }

  // 6. Consultations
  await Promise.all([
    Consultation.create({
      appointmentId: appointments[2]._id,
      patientId: patients[2]._id,
      doctorId: drPatel._id,
      chiefComplaint: 'Severe recurrent unilateral headaches with photophobia and nausea for 6 weeks.',
      diagnosis: 'Chronic Migraine without Aura (ICD-10 G43.0)',
      prescription: [
        { medicine: 'Sumatriptan Succinate', dosage: '50mg', duration: 'As required', instructions: 'Take 1 tablet at onset' },
        { medicine: 'Propranolol Hydrochloride', dosage: '40mg', duration: '30 days', instructions: 'Once daily morning' },
      ],
      labTests: ['Brain MRI with Contrast', 'Complete Blood Count (CBC)'],
      followUpDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Advised lifestyle modification, blue light filter glasses, and strict headache diary.',
    }),
    Consultation.create({
      appointmentId: appointments[4]._id,
      patientId: patients[4]._id,
      doctorId: drSingh._id,
      chiefComplaint: 'Acute right knee swelling and inability to bear weight after fall.',
      diagnosis: 'Grade II Medial Collateral Ligament (MCL) Tear with Joint Effusion',
      prescription: [
        { medicine: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', duration: '7 days', instructions: 'Twice daily after meals' },
        { medicine: 'Pantoprazole', dosage: '40mg', duration: '7 days', instructions: 'Once daily before breakfast' },
      ],
      labTests: ['Right Knee High-Resolution MRI', 'Digital X-Ray Knee AP/Lateral'],
      followUpDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      notes: 'Hinged knee brace immobilized at 20 degrees. Cold compression 4x daily.',
    }),
  ]);

  // 7. Invoices
  await Promise.all([
    Invoice.create({
      invoiceId: 'INV-00001',
      patientId: patients[2]._id,
      appointmentId: appointments[2]._id,
      consultationFee: 1000,
      additionalCharges: [
        { description: 'Neurological EEG Brain Mapping', amount: 1500 },
        { description: 'Routine Pathology Profiling', amount: 450 },
      ],
      discount: 250,
      totalAmount: 2700,
      paidAmount: 2700,
      status: 'PAID',
      paymentMethod: 'ONLINE',
      paymentDate: yesterday,
      createdBy: billing._id,
    }),
    Invoice.create({
      invoiceId: 'INV-00002',
      patientId: patients[4]._id,
      appointmentId: appointments[4]._id,
      consultationFee: 700,
      additionalCharges: [
        { description: 'Emergency Knee Splint & Immobilizer', amount: 1200 },
        { description: 'Digital High-Resolution X-Ray', amount: 800 },
      ],
      discount: 200,
      totalAmount: 2500,
      paidAmount: 1500,
      status: 'PARTIAL',
      paymentMethod: 'CARD',
      paymentDate: yesterday,
      createdBy: billing._id,
    }),
  ]);

  // 8. Hospital Services
  await HospitalService.insertMany([
    { code: 'SRV-LAB01', name: 'Complete Blood Count (CBC)', category: 'LABORATORY', price: 350, description: 'Measures RBC, WBC, Platelets, and Hemoglobin' },
    { code: 'SRV-LAB02', name: 'Comprehensive Lipid Profile', category: 'LABORATORY', price: 650, description: 'Total cholesterol, HDL, LDL, VLDL, and Triglycerides' },
    { code: 'SRV-RAD01', name: 'Digital Chest X-Ray (PA View)', category: 'RADIOLOGY', price: 600, description: 'Digital pulmonary and cardiac silhouette imaging' },
    { code: 'SRV-RAD02', name: 'MRI Brain with Contrast', category: 'RADIOLOGY', price: 6500, description: 'High-tesla cerebral neuroimaging' },
    { code: 'SRV-CARD01', name: '12-Lead Electrocardiogram (ECG)', category: 'PROCEDURE', price: 400, description: 'Cardiac electrical activity measurement' },
    { code: 'SRV-CARD02', name: '2D Echocardiography with Doppler', category: 'PROCEDURE', price: 2500, description: 'Heart valve and chamber ultrasound examination' },
    { code: 'SRV-ROOM01', name: 'ICU Bed Charges (Per 24h)', category: 'ROOM_CHARGE', price: 5000, description: 'Intensive Care Unit with critical monitoring' },
  ]);

  // 9. Pharmacy
  const expiryNextYear = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  await PharmacyItem.insertMany([
    { code: 'MED-001', name: 'Paracetamol IP 650mg', genericName: 'Acetaminophen', category: 'TABLET', dosageStrength: '650mg', manufacturer: 'Cipla Ltd', unitPrice: 3.5, stockQuantity: 2400, reorderLevel: 300, batchNumber: 'CP-8921', expiryDate: expiryNextYear, requiresPrescription: false },
    { code: 'MED-002', name: 'Augmentin 625mg', genericName: 'Amoxicillin + Clavulanate', category: 'TABLET', dosageStrength: '625mg', manufacturer: 'GSK Pharma', unitPrice: 22.0, stockQuantity: 850, reorderLevel: 100, batchNumber: 'GSK-4412', expiryDate: expiryNextYear, requiresPrescription: true },
    { code: 'MED-003', name: 'Pantocid 40mg', genericName: 'Pantoprazole Sodium', category: 'TABLET', dosageStrength: '40mg', manufacturer: 'Sun Pharma', unitPrice: 12.0, stockQuantity: 1500, reorderLevel: 200, batchNumber: 'SP-1099', expiryDate: expiryNextYear, requiresPrescription: false },
    { code: 'MED-004', name: 'Glycomet-GP 1/500', genericName: 'Glimepiride + Metformin', category: 'TABLET', dosageStrength: '1mg/500mg', manufacturer: 'USV Pharma', unitPrice: 9.5, stockQuantity: 1200, reorderLevel: 150, batchNumber: 'USV-771', expiryDate: expiryNextYear, requiresPrescription: true },
  ]);

  // 10. Ward Beds
  await WardBed.insertMany([
    { bedNumber: 'ICU-01', wardType: 'ICU', floor: 2, roomNumber: '201', dailyRate: 5000, status: 'OCCUPIED', currentPatientId: patients[4]._id, assignedDoctorId: drSingh._id, admittedAt: yesterday },
    { bedNumber: 'ICU-02', wardType: 'ICU', floor: 2, roomNumber: '201', dailyRate: 5000, status: 'AVAILABLE' },
    { bedNumber: 'GW-101', wardType: 'GENERAL', floor: 1, roomNumber: '101', dailyRate: 1000, status: 'OCCUPIED', currentPatientId: patients[2]._id, assignedDoctorId: drPatel._id, admittedAt: yesterday },
    { bedNumber: 'GW-102', wardType: 'GENERAL', floor: 1, roomNumber: '101', dailyRate: 1000, status: 'AVAILABLE' },
    { bedNumber: 'PVT-301', wardType: 'PRIVATE_AC', floor: 3, roomNumber: '301', dailyRate: 3500, status: 'AVAILABLE' },
  ]);

  // 11. Audit Logs
  await Promise.all([
    AuditLog.create({
      userId: admin._id,
      userEmail: admin.email,
      userRole: 'ADMIN',
      action: 'ATLAS_CLOUD_INITIALIZATION',
      resource: 'MongoDBAtlas',
      details: 'Hospital management platform seeded directly into MongoDB Atlas Cluster0',
      ipAddress: '127.0.0.1',
      timestamp: new Date(),
    }),
  ]);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SUCCESS! ALL 11 COLLECTIONS SEEDED DIRECTLY INTO MONGODB ATLAS!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Now refresh your MongoDB Atlas Data Explorer tab in your browser!');
  console.log('You will see "medicore_db" with all 11 collections displayed.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedAtlas().catch((err) => {
  console.error('Fatal error during Atlas seed:', err);
  process.exit(1);
});
