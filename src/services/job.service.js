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
    // update job and technician status
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

    // update technician status
    await technicianRepository.updateStatus(job.technicianId, status);

    return job;
  },

  // get checklist from template
  async getChecklist(jobId) {
    const job = await jobRepository.findById(jobId);
    const template = await checklistRepository.findByService(job.serviceType);

    // Return correct structure based on service type
    // UCI: { serviceType, items, existingAnswers }
    // PDI: { serviceType, sections, existingAnswers }
    if (template.serviceType === 'UCI') {
      return {
        serviceType: template.serviceType,
        items: template.items || [],
        existingAnswers: job.checklistAnswers || []
      };
    } else if (template.serviceType === 'PDI') {
      // Clone sections to avoid mutating the template
      const sections = JSON.parse(JSON.stringify(template.sections || []));

      // Fetch technician data if assigned
      let technicianName = 'Technician';
      if (job.technicianId) {
        const technician = await technicianRepository.findById(job.technicianId);
        if (technician && technician.name) {
          technicianName = technician.name;
        }
      }

      // Get location address
      let locationAddress = 'Location';
      if (job.location && job.location.address) {
        locationAddress = job.location.address;
      }

      // Inject dynamic options for technician_name and location
      sections.forEach(section => {
        section.items.forEach(item => {
          if (item.key === 'technician_name') {
            item.options = [technicianName];
          } else if (item.key === 'location') {
            item.options = [locationAddress];
          }
        });
      });

      return {
        serviceType: template.serviceType,
        sections: sections,
        existingAnswers: job.checklistAnswers || []
      };
    } else {
      // VSH or other service types - return as-is with existing answers
      return {
        ...template,
        existingAnswers: job.checklistAnswers || []
      };
    }
  },

  // submit answer
  async submitCheckpoint(jobId, answer) {
    const job = await jobRepository.findById(jobId);

    if (!job) throw new Error("Job not found");

    if (!job.checklistAnswers) {
      job.checklistAnswers = [];
    }

    // Check if checkpoint already exists
    const index = job.checklistAnswers.findIndex(
      item => item.checkpointKey === answer.checkpointKey
    );

    if (index !== -1) {
      // UPDATE existing checkpoint
      job.checklistAnswers[index] = {
        ...job.checklistAnswers[index],
        ...answer
      };
    } else {
      // ADD new checkpoint
      job.checklistAnswers.push(answer);
    }

    const saved = await jobRepository.save(job);
    return saved;
  },

  // complete inspection
  async completeInspection(jobId, reportData) {
    const job = await jobRepository.findById(jobId);

    // create or update report
    let report = await inspectionRepository.findByJob(jobId);

    if (report) {
      // Update existing report
      report = await inspectionRepository.update(report._id, {
        ...reportData,
        checklistAnswers: job.checklistAnswers
      });
    } else {
      // Create new report
      report = await inspectionRepository.create({
        jobId,
        technicianId: job.technicianId,
        checklistAnswers: job.checklistAnswers,
        ...reportData
      });
    }

    // update job status to inspection_completed (editable, not sent yet)
    await jobRepository.updateStatus(jobId, 'inspection_completed');
    await technicianRepository.updateStatus(job.technicianId, 'inspection_completed');

    return report;
  },

  // send report to admin (final submission)
  async sendReport(jobId) {
    const job = await jobRepository.findById(jobId);

    if (!job) throw new Error("Job not found");

    // Only allow sending if inspection is completed but not sent yet
    if (job.status !== 'inspection_completed') {
      throw new Error("Cannot send report. Inspection must be completed first.");
    }

    // Mark as final - no edits allowed after this
    await jobRepository.updateStatus(jobId, 'report_sent');
    await technicianRepository.updateStatus(job.technicianId, 'report_sent');

    return job;
  },

  // reopen inspection for editing
  async reopenInspection(jobId) {
    const job = await jobRepository.findById(jobId);

    if (!job) throw new Error("Job not found");

    // Block editing if report has been sent to admin
    if (job.status === 'report_sent') {
      throw new Error("Cannot edit report. It has already been sent to admin.");
    }

    // Change status back to in_inspection to allow editing
    await jobRepository.updateStatus(jobId, 'in_inspection');
    await technicianRepository.updateStatus(job.technicianId, 'in_inspection');

    return job;
  },

  // summary
  async completedSummary(jobId) {
    const job = await jobRepository.findById(jobId);
    const report = await inspectionRepository.findByJob(jobId);

    return {
      job,
      report
    };
  }
};
