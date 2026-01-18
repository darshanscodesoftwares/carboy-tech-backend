// // Job Service
// // Contains full business logic of job lifecycle.
// // Uses repositories only (no direct DB calls).

// const jobRepository = require('../repositories/job.repository');
// const checklistRepository = require('../repositories/checklist.repository');
// const inspectionRepository = require('../repositories/inspection.repository');
// const technicianRepository = require('../repositories/technician.repository');

// module.exports = {

//   // list jobs
//   async listByTechnician(technicianId, status) {
//     return jobRepository.findByTechnician(technicianId, status);
//   },

//   // accept job
//   async acceptJob(jobId, technicianId) {
//     const job = await jobRepository.assignTechnician(jobId, technicianId);
//     await technicianRepository.updateStatus(technicianId, 'assigned');
//     return job;
//   },

//   // get job details
//   async getDetails(jobId) {
//     return jobRepository.findById(jobId);
//   },

//   // update status
//   async updateStatus(jobId, status) {
//     const job = await jobRepository.updateStatus(jobId, status);
//     await technicianRepository.updateStatus(job.technician, status);
//     return job;
//   },

//   // =====================================================
//   // GET CHECKLIST (FIXED – SAVED VALUES ARE MERGED BACK)
//   // =====================================================
//   async getChecklist(jobId) {
//     const job = await jobRepository.findById(jobId);
//     const template = await checklistRepository.findByService(job.serviceType);

//     console.log('[DEBUG] Template serviceType:', template?.serviceType);
//     console.log('[DEBUG] Template has sections:', !!template?.sections);
//     console.log('[DEBUG] Template has items:', !!template?.items);
//     if (template?.sections) console.log('[DEBUG] Sections count:', template.sections.length);

//     if (!job || !template) return template;

//     // Map saved answers by checkpointKey
//     const answersMap = {};
//     (job.checklistAnswers || []).forEach(ans => {
//       answersMap[ans.checkpointKey] = ans;
//     });

//     // =========================
//     // UCI CHECKLIST (SECTIONS - IDENTICAL TO PDI)
//     // =========================
//     if (template.serviceType === 'UCI') {
//       // UCI now uses sections structure (identical to PDI)
//       if (template.sections) {
//         const sections = JSON.parse(JSON.stringify(template.sections || []));

//         // Fetch technician details if assigned
//         let technicianName = 'Technician';
//         if (job.technicianId) {
//           const technician = await technicianRepository.findById(job.technicianId);
//           if (technician?.name) technicianName = technician.name;
//         }

//         // Get location address
//         let locationAddress = 'Location';
//         if (job.location?.address) locationAddress = job.location.address;

//         sections.forEach(section => {
//           section.items.forEach(item => {
//             // Inject dropdown options dynamically for specific fields
//             if (item.key === 'inspection_done_by') {
//               // Keep existing options from template
//             }

//             if (item.key === 'inspection_location') {
//               // Can optionally inject job location if needed
//               // For now, keep template options
//             }

//             // 🔑 MERGE SAVED VALUES INTO ITEM
//             const saved = answersMap[item.key];
//             if (saved) {
//               item.selectedOption = saved.selectedOption ?? null;
//               item.value = saved.value ?? null;
//               item.notes = saved.notes ?? null;
//               item.photoUrl = saved.photoUrl ?? null;
//               item.photoUrls = saved.photoUrls ?? null;
//             }
//           });
//         });

//         return {
//           serviceType: template.serviceType,
//           sections
//         };
//       }

//       // Backward compatibility: if template still has flat items
//       const items = (template.items || []).map(item => {
//         const saved = answersMap[item.key];
//         return {
//           ...item,
//           selectedOption: saved?.selectedOption ?? null,
//           value: saved?.value ?? null,
//           notes: saved?.notes ?? null,
//           photoUrl: saved?.photoUrl ?? null,
//           photoUrls: saved?.photoUrls ?? null
//         };
//       });

//       return {
//         serviceType: template.serviceType,
//         items
//       };
//     }

//     // =========================
//     // PDI CHECKLIST (SECTIONS)
//     // =========================
//     if (template.serviceType === 'PDI') {
//       const sections = JSON.parse(JSON.stringify(template.sections || []));

//       // Technician name
//       let technicianName = 'Technician';
//       if (job.technician) {
//         const technician = await technicianRepository.findById(job.technician);
//         if (technician?.name) technicianName = technician.name;
//       }

//       // Location
//       let locationAddress = 'Location';
//       if (job.location?.address) locationAddress = job.location.address;

//       sections.forEach(section => {
//         section.items.forEach(item => {

//           // Inject dropdown options dynamically
//           if (item.key === 'technician_name') {
//             item.options = [technicianName];
//           }

//           if (item.key === 'location') {
//             item.options = [locationAddress];
//           }

//           // 🔑 MERGE SAVED VALUES INTO ITEM
//           const saved = answersMap[item.key];
//           if (saved) {
//             item.selectedOption = saved.selectedOption ?? null;
//             item.value = saved.value ?? null;
//             item.notes = saved.notes ?? null;
//             item.photoUrl = saved.photoUrl ?? null;
//             item.photoUrls = saved.photoUrls ?? null;
//           }
//         });
//       });

//       return {
//         serviceType: template.serviceType,
//         sections
//       };
//     }

//     return template;
//   },

//   // =====================================================
//   // SAVE / UPDATE CHECKPOINT ANSWER
//   // =====================================================
//   async submitCheckpoint(jobId, answer) {
//     const job = await jobRepository.findById(jobId);
//     if (!job) throw new Error("Job not found");

//     if (!job.checklistAnswers) job.checklistAnswers = [];

//     const index = job.checklistAnswers.findIndex(
//       item => item.checkpointKey === answer.checkpointKey
//     );

//     if (index !== -1) {
//       job.checklistAnswers[index] = {
//         ...job.checklistAnswers[index],
//         ...answer
//       };
//     } else {
//       job.checklistAnswers.push(answer);
//     }

//     return jobRepository.save(job);
//   },

//   // =====================================================
//   // COMPLETE INSPECTION
//   // =====================================================
//   async completeInspection(jobId, reportData) {
//     const job = await jobRepository.findById(jobId);

//     let report = await inspectionRepository.findByJob(jobId);

//     if (report) {
//       report = await inspectionRepository.update(report._id, {
//         ...reportData,
//         answers: job.checklistAnswers
//       });
//     } else {
//       report = await inspectionRepository.create({
//         jobId,
//         technicianId: job.technician,
//         answers: job.checklistAnswers,
//         ...reportData
//       });
//     }

//     await jobRepository.updateStatus(jobId, 'completed');
//     await technicianRepository.updateStatus(job.technician, 'completed');

//     return report;
//   },

//   // =====================================================
//   // SEND REPORT TO ADMIN (FINAL SUBMISSION)
//   // =====================================================
//   async sendReport(jobId) {
//     const job = await jobRepository.findById(jobId);
//     if (!job) throw new Error("Job not found");

//     if (job.status !== 'completed') {
//       throw new Error("Cannot send report. Inspection must be completed first.");
//     }

//     // Create or update InspectionReport
//     let report = await inspectionRepository.findByJob(jobId);

//     if (report) {
//       // Update existing report
//       report = await inspectionRepository.update(report._id, {
//         answers: job.checklistAnswers,
//         submittedAt: new Date()
//       });
//     } else {
//       // Create new report
//       report = await inspectionRepository.create({
//         jobId,
//         technicianId: job.technician,
//         answers: job.checklistAnswers,
//         submittedAt: new Date()
//       });
//     }

//     // Link job to report
//     job.reportId = report._id;
//     await jobRepository.save(job);

//     return job;
//   },

//   // =====================================================
//   // REOPEN INSPECTION
//   // =====================================================
//   async reopenInspection(jobId) {
//     const job = await jobRepository.findById(jobId);
//     if (!job) throw new Error("Job not found");

//     await jobRepository.updateStatus(jobId, 'in_inspection');
//     await technicianRepository.updateStatus(job.technician, 'in_inspection');

//     return job;
//   },

//   // =====================================================
//   // COMPLETED SUMMARY
//   // =====================================================
//   async completedSummary(jobId) {
//     const job = await jobRepository.findById(jobId);
//     const report = await inspectionRepository.findByJob(jobId);

//     return {
//       job,
//       report
//     };
//   },

//  // =====================================================
// // SEND REPORT TO ADMIN (FINAL SUBMISSION)
// // =====================================================
// async sendReport(jobId) {
//   const job = await jobRepository.findById(jobId);
//   if (!job) throw new Error('Job not found');

//   // Ensure inspection is completed
//   if (job.status !== 'completed') {
//     throw new Error('Inspection not completed yet');
//   }

//   // Find inspection report created during completeInspection
//   const report = await inspectionRepository.findByJob(jobId);
//   if (!report) {
//     throw new Error('Inspection report not found');
//   }

//   // Mark report as submitted
//   report.submittedAt = new Date();
//   await inspectionRepository.update(report._id, report);

//   // Update job status → THIS is what admin waits for
//   await jobRepository.updateStatus(jobId, 'report_sent');

//   return {
//     jobId,
//     reportId: report._id,
//     status: 'report_sent'
//   };
// }

// };

// Job Service
// Contains full business logic of job lifecycle.
// Uses repositories only (no direct DB calls).

const jobRepository = require("../repositories/job.repository");
const checklistRepository = require("../repositories/checklist.repository");
const inspectionRepository = require("../repositories/inspection.repository");
const technicianRepository = require("../repositories/technician.repository");

module.exports = {
  // =====================================================
  // LIST JOBS
  // =====================================================
  async listByTechnician(technicianId, status) {
    return jobRepository.findByTechnician(technicianId, status);
  },

  // =====================================================
  // ACCEPT JOB
  // =====================================================
  async acceptJob(jobId, technicianId) {
    const job = await jobRepository.assignTechnician(jobId, technicianId);
    await technicianRepository.updateStatus(technicianId, "assigned");
    return job;
  },

  // =====================================================
  // GET JOB DETAILS
  // =====================================================
  async getDetails(jobId) {
    return jobRepository.findById(jobId);
  },

  // =====================================================
  // UPDATE STATUS
  // =====================================================
  async updateStatus(jobId, status) {
    const job = await jobRepository.updateStatus(jobId, status);
    await technicianRepository.updateStatus(job.technician, status);
    return job;
  },

  // =====================================================
  // GET CHECKLIST (MERGE SAVED ANSWERS)
  // =====================================================
  async getChecklist(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    const template = await checklistRepository.findByService(job.serviceType);
    if (!template) return null;

    const answersMap = {};
    (job.checklistAnswers || []).forEach((a) => {
      answersMap[a.checkpointKey] = a;
    });

    if (!template.sections) return template;

    const sections = JSON.parse(JSON.stringify(template.sections));

    let technicianName = "Technician";
    if (job.technician) {
      const tech = await technicianRepository.findById(job.technician);
      if (tech?.name) technicianName = tech.name;
    }

    let locationAddress = job.location?.address || "Location";

    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.key === "technician_name") item.options = [technicianName];
        if (item.key === "location") item.options = [locationAddress];

        const saved = answersMap[item.key];
        if (saved) {
          item.selectedOption = saved.selectedOption ?? null;
          item.value = saved.value ?? null;
          item.notes = saved.notes ?? null;
          item.photoUrl = saved.photoUrl ?? null;
          item.photoUrls = saved.photoUrls ?? null;
        }
      });
    });

    return {
      serviceType: template.serviceType,
      sections,
    };
  },

  // =====================================================
  // SAVE / UPDATE CHECKPOINT ANSWER (ATOMIC)
  // =====================================================
  async submitCheckpoint(jobId, answer) {
    // Try to update existing checkpoint atomically
    let job = await jobRepository.updateCheckpoint(jobId, answer.checkpointKey, answer);

    // If checkpoint doesn't exist, add it atomically
    if (!job) {
      job = await jobRepository.addCheckpoint(jobId, answer);
    }

    if (!job) throw new Error("Job not found");

    return job;
  },

  // =====================================================
  // COMPLETE INSPECTION (NO ADMIN VISIBILITY YET)
  // =====================================================
  async completeInspection(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    await jobRepository.updateById(jobId, { status: "completed" });
    await technicianRepository.updateStatus(job.technician, "completed");

    return job;
  },

  // =====================================================
  // SEND REPORT TO ADMIN (🔥 CRITICAL FIX 🔥)
  // =====================================================
  async sendReport(jobId, remarks) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    if (job.status !== "completed") {
      throw new Error("Inspection must be completed first");
    }

    // ✅ DEDUPE CHECKLIST ANSWERS BY checkpointKey
    const dedupedAnswersMap = {};
    (job.checklistAnswers || []).forEach((answer) => {
      dedupedAnswersMap[answer.checkpointKey] = answer;
    });
    const dedupedAnswers = Object.values(dedupedAnswersMap);

    // 🔑 CREATE OR UPDATE INSPECTION REPORT
    let report = await inspectionRepository.findByJobId(jobId);

    if (report) {
      report = await inspectionRepository.update(report._id, {
        checklistAnswers: dedupedAnswers,
        technicianRemarks: remarks || "",
        submittedAt: new Date(),
      });
    } else {
      report = await inspectionRepository.create({
        job: job._id, // ✅ FIXED
        technician: job.technician, // ✅ FIXED
        checklistTemplate: job.checklistTemplate || null,
        checklistAnswers: dedupedAnswers,
        technicianRemarks: remarks || "",
        submittedAt: new Date(),
      });
    }

    // 🔑 LINK REPORT TO JOB
    await jobRepository.updateById(job._id, {
      inspectionReport: report._id,
      status: "report_sent",
    });

    return {
      jobId: job._id,
      reportId: report._id,
      status: "report_sent",
    };
  },

  // =====================================================
  // REOPEN INSPECTION
  // =====================================================
  async reopenInspection(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    await jobRepository.updateById(jobId, { status: "in_inspection" });
    await technicianRepository.updateStatus(job.technician, "in_inspection");

    return job;
  },

  // =====================================================
  // COMPLETED SUMMARY (ADMIN)
  // =====================================================
  async completedSummary(jobId) {
    const job = await jobRepository.findById(jobId);
    const report = await inspectionRepository.findByJobId(jobId);

    return { job, report };
  },
};
