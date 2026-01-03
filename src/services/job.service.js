// Job Service
// Contains full business logic of job lifecycle.
// Uses repositories only (no direct DB calls).

const jobRepository = require('../repositories/job.repository');
const checklistRepository = require('../repositories/checklist.repository');
const inspectionRepository = require('../repositories/inspection.repository');
const technicianRepository = require('../repositories/technician.repository');

module.exports = {

  // list jobs
  async listByTechnician(technicianId, status) {
    return jobRepository.findByTechnician(technicianId, status);
  },

  // accept job
  async acceptJob(jobId, technicianId) {
    const job = await jobRepository.assignTechnician(jobId, technicianId);
    await technicianRepository.updateStatus(technicianId, 'assigned');
    return job;
  },

  // get job details
  async getDetails(jobId) {
    return jobRepository.findById(jobId);
  },

  // update status
  async updateStatus(jobId, status) {
    const job = await jobRepository.updateStatus(jobId, status);
    await technicianRepository.updateStatus(job.technician, status);
    return job;
  },

  // =====================================================
  // GET CHECKLIST (FIXED – SAVED VALUES ARE MERGED BACK)
  // =====================================================
  async getChecklist(jobId) {
    const job = await jobRepository.findById(jobId);
    const template = await checklistRepository.findByService(job.serviceType);

    if (!job || !template) return template;

    // Map saved answers by checkpointKey
    const answersMap = {};
    (job.checklistAnswers || []).forEach(ans => {
      answersMap[ans.checkpointKey] = ans;
    });

    // =========================
    // UCI CHECKLIST (FLAT)
    // =========================
    if (template.serviceType === 'UCI') {
      const items = (template.items || []).map(item => {
        const saved = answersMap[item.key];
        return {
          ...item,
          selectedOption: saved?.selectedOption ?? null,
          value: saved?.value ?? null,
          notes: saved?.notes ?? null,
          photoUrl: saved?.photoUrl ?? null,
          photoUrls: saved?.photoUrls ?? null
        };
      });

      return {
        serviceType: template.serviceType,
        items
      };
    }

    // =========================
    // PDI CHECKLIST (SECTIONS)
    // =========================
    if (template.serviceType === 'PDI') {
      const sections = JSON.parse(JSON.stringify(template.sections || []));

      // Technician name
      let technicianName = 'Technician';
      if (job.technician) {
        const technician = await technicianRepository.findById(job.technician);
        if (technician?.name) technicianName = technician.name;
      }

      // Location
      let locationAddress = 'Location';
      if (job.location?.address) locationAddress = job.location.address;

      sections.forEach(section => {
        section.items.forEach(item => {

          // Inject dropdown options dynamically
          if (item.key === 'technician_name') {
            item.options = [technicianName];
          }

          if (item.key === 'location') {
            item.options = [locationAddress];
          }

          // 🔑 MERGE SAVED VALUES INTO ITEM
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
        sections
      };
    }

    return template;
  },

  // =====================================================
  // SAVE / UPDATE CHECKPOINT ANSWER
  // =====================================================
  async submitCheckpoint(jobId, answer) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    if (!job.checklistAnswers) job.checklistAnswers = [];

    const index = job.checklistAnswers.findIndex(
      item => item.checkpointKey === answer.checkpointKey
    );

    if (index !== -1) {
      job.checklistAnswers[index] = {
        ...job.checklistAnswers[index],
        ...answer
      };
    } else {
      job.checklistAnswers.push(answer);
    }

    return jobRepository.save(job);
  },

  // =====================================================
  // COMPLETE INSPECTION
  // =====================================================
  async completeInspection(jobId, reportData) {
    const job = await jobRepository.findById(jobId);

    let report = await inspectionRepository.findByJob(jobId);

    if (report) {
      report = await inspectionRepository.update(report._id, {
        ...reportData,
        answers: job.checklistAnswers
      });
    } else {
      report = await inspectionRepository.create({
        jobId,
        technicianId: job.technician,
        answers: job.checklistAnswers,
        ...reportData
      });
    }

    await jobRepository.updateStatus(jobId, 'completed');
    await technicianRepository.updateStatus(job.technician, 'completed');

    return report;
  },

  // =====================================================
  // SEND REPORT TO ADMIN (FINAL SUBMISSION)
  // =====================================================
  async sendReport(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    if (job.status !== 'completed') {
      throw new Error("Cannot send report. Inspection must be completed first.");
    }

    // Create or update InspectionReport
    let report = await inspectionRepository.findByJob(jobId);

    if (report) {
      // Update existing report
      report = await inspectionRepository.update(report._id, {
        answers: job.checklistAnswers,
        submittedAt: new Date()
      });
    } else {
      // Create new report
      report = await inspectionRepository.create({
        jobId,
        technicianId: job.technician,
        answers: job.checklistAnswers,
        submittedAt: new Date()
      });
    }

    // Update job status and link to report
    job.status = 'report_sent';
    job.reportId = report._id;
    await jobRepository.save(job);

    await technicianRepository.updateStatus(job.technician, 'report_sent');

    return job;
  },

  // =====================================================
  // REOPEN INSPECTION
  // =====================================================
  async reopenInspection(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) throw new Error("Job not found");

    await jobRepository.updateStatus(jobId, 'in_inspection');
    await technicianRepository.updateStatus(job.technician, 'in_inspection');

    return job;
  },

  // =====================================================
  // COMPLETED SUMMARY
  // =====================================================
  async completedSummary(jobId) {
    const job = await jobRepository.findById(jobId);
    const report = await inspectionRepository.findByJob(jobId);

    return {
      job,
      report
    };
  }
};
