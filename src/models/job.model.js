// Job Model (Main entity for Technician flow)
// This model stores a job created by customer/admin.
// It is SQL-friendly: we store foreign keys + snapshots for display.
// Later, SQL tables will map 1:1 to these fields.

const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    // which inspection type
    serviceType: {
      type: String,
      enum: ["UCI", "PDI", "VSH"],
      required: true,
    },

    // references (normalized)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: false,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Technician",
      required: false,
    },

    // snapshot: data shown to technician
    customerSnapshot: {
      name: String,
      phone: String,
      email: String,
      // address can be added here if needed
    },

    vehicleSnapshot: {
      brand: String,
      model: String,
      year: Number,
    },

    // booking schedule
    schedule: {
      date: { type: String, required: true }, // ISO date string
      slot: { type: String, required: true }, // e.g., "10:00 AM"
    },

    // inspection location (map)
    location: {
      address: String,
      lat: Number,
      lng: Number,
    },

    // current job status in the flow
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "traveling",
        "reached",
        "in_inspection",
        "completed",
        "report_sent", // ✅ ADD THIS
      ],
      default: "pending",
    },

    // placeholder for final report connection
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "InspectionReport" },

    // optional: store raw answers inside job (quick MVP)
    // Later, we can move answers to inspection_reports document.
    checklistAnswers: [
      {
        checkpointKey: String,
        selectedOption: String, // for radio/dropdown inputs
        value: String, // for text/textarea inputs
        notes: String,
        photoUrl: String, // single photo (for backward compatibility)
        photoUrls: [String], // multiple photos (for multi-image uploads)
      },
    ],

    // technician remarks (mirrored from InspectionReport for persistence)
    technicianRemarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", JobSchema);
