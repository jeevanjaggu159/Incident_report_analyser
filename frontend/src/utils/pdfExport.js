import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generatePDF = (incident) => {
  if (!incident) return

  try {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text(`Incident Report #${incident.id}`, 14, 20)

    // Meta data
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28)

    // Original Report Section
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('Original Report', 14, 40)

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    const splitReport = doc.splitTextToSize(incident.report_text, 180)
    doc.text(splitReport, 14, 48)

    let currentY = 48 + (splitReport.length * 5) + 10

    // Analysis Section
    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('AI Analysis Summary', 14, currentY)

    const analysisInfo = [
      ['Category', incident.analysis?.category || 'Uncategorized'],
      ['Severity', incident.analysis?.severity || 'Unknown'],
      ['Root Cause', incident.analysis?.root_cause || 'Unknown']
    ]

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Attribute', 'Details']],
      body: analysisInfo,
      theme: 'grid',
      headStyles: { fillColor: [66, 135, 245] }
    })

    currentY = doc.lastAutoTable.finalY + 15

    // Contributing Factors
    if (incident.analysis?.contributing_factors?.length) {
      doc.setFontSize(14)
      doc.text('Contributing Factors', 14, currentY)
      const factors = incident.analysis.contributing_factors.map(f => [f])

      autoTable(doc, {
        startY: currentY + 5,
        body: factors,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 11, textColor: [80, 80, 80] }
      })
      currentY = doc.lastAutoTable.finalY + 10
    }

    // Prevention Measures
    if (incident.analysis?.prevention_measures?.length) {
      doc.setFontSize(14)
      doc.text('Prevention Measures', 14, currentY)
      const measures = incident.analysis.prevention_measures.map(m => [m])

      autoTable(doc, {
        startY: currentY + 5,
        body: measures,
        theme: 'plain',
        styles: { cellPadding: 2, fontSize: 11, textColor: [20, 120, 40] }
      })
    }

    // Save PDF using native jsPDF method
    doc.save(`incident_${incident.id}_report.pdf`)
  } catch (err) {
    console.error("PDF Generate Error:", err)
    alert("Failed to generate PDF: " + err.message)
  }
}
