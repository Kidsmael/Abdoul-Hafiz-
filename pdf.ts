import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { toast } from "sonner";

export type CvPdfData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  education: { school: string; degree: string; period: string }[];
  experience: { company: string; role: string; period: string; description: string }[];
  skills: string[];
  languages: { name: string; level: string }[];
};

/** Génère le PDF du CV avec jsPDF puis force le téléchargement. */
export function exportCvToPdf(cv: CvPdfData, filename: string) {
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 22;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
    };

    const split = (text: string, width = contentW) =>
      pdf.splitTextToSize(text.trim(), width) as string[];

    const writeLines = (lines: string[], lineHeight: number) => {
      for (const line of lines) {
        ensureSpace(lineHeight + 1);
        pdf.text(line, margin, y);
        y += lineHeight;
      }
    };

    const section = (title: string) => {
      ensureSpace(14);
      y += 4;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(11, 30, 63);
      pdf.text(title.toUpperCase(), margin, y);
      y += 3;
      pdf.setDrawColor(11, 30, 63);
      pdf.setLineWidth(0.35);
      pdf.line(margin, y, margin + 28, y);
      y += 6;
    };

    const paragraph = (text: string, size = 10, color: [number, number, number] = [51, 65, 85]) => {
      if (!text.trim()) return;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      writeLines(split(text), size * 0.48 + 1.2);
      y += 2;
    };

    const fullName = `${cv.firstName || "Prénom"} ${cv.lastName || "Nom"}`.trim();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(11, 30, 63);
    writeLines(split(fullName, contentW), 9.5);

    const contact = [cv.email, cv.phone, cv.address]
      .map((item) => item.trim())
      .filter(Boolean)
      .join("  •  ");
    if (contact) {
      y += 1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.setTextColor(71, 85, 105);
      writeLines(split(contact), 5);
    }

    y += 3;
    pdf.setDrawColor(11, 30, 63);
    pdf.setLineWidth(1.2);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    if (cv.summary.trim()) {
      section("Profil");
      paragraph(cv.summary);
    }

    const experiences = cv.experience.filter(
      (item) => item.company || item.role || item.description,
    );
    if (experiences.length) {
      section("Expériences professionnelles");
      for (const item of experiences) {
        ensureSpace(18);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(15, 23, 42);
        const title = [item.role || "Poste", item.company].filter(Boolean).join(" — ");
        const titleLines = split(title, item.period ? contentW - 42 : contentW);
        pdf.text(titleLines, margin, y);
        if (item.period) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(100, 116, 139);
          pdf.text(item.period, pageW - margin, y, { align: "right" });
        }
        y += Math.max(5, titleLines.length * 5);
        paragraph(item.description, 9.5);
      }
    }

    const education = cv.education.filter((item) => item.school || item.degree);
    if (education.length) {
      section("Formation");
      for (const item of education) {
        ensureSpace(14);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text(item.degree || "Diplôme", margin, y);
        if (item.period) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(100, 116, 139);
          pdf.text(item.period, pageW - margin, y, { align: "right" });
        }
        y += 5;
        paragraph(item.school, 9.5);
      }
    }

    if (cv.skills.length) {
      section("Compétences");
      paragraph(cv.skills.join(" • "), 9.8, [15, 23, 42]);
    }

    const languages = cv.languages.filter((item) => item.name);
    if (languages.length) {
      section("Langues");
      paragraph(
        languages.map((item) => [item.name, item.level].filter(Boolean).join(" — ")).join(" • "),
        9.8,
        [15, 23, 42],
      );
    }

    const pages = pdf.getNumberOfPages();
    for (let i = 1; i <= pages; i += 1) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`DimDocs • ${i}/${pages}`, pageW - margin, pageH - 9, { align: "right" });
    }

    triggerPdfDownload(pdf, filename);
    toast.success("PDF exporté avec succès");
  } catch (err) {
    console.error("[cv-pdf-export] failed", err);
    toast.error("Échec de l'export PDF", {
      description: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Exporte un élément HTML en PDF via html2canvas.
 * Clone dans un iframe isolé pour éviter les erreurs oklch.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const toastId = toast.loading("Génération du PDF…");
  try {
    const width = el.offsetWidth || 800;
    const height = el.offsetHeight || 1120;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      *,*::before,*::after{box-sizing:border-box;}
      html,body{margin:0;padding:0;background:#ffffff;color:#0f172a;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
      img{max-width:100%;}
    </style></head><body></body></html>`);
    doc.close();

    const clone = el.cloneNode(true) as HTMLElement;
    doc.body.appendChild(clone);
    sanitizeColors(clone);

    // Attendre fonts + images
    await new Promise((r) => setTimeout(r, 120));

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: width,
      windowHeight: clone.scrollHeight,
    });

    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    triggerPdfDownload(pdf, filename);
    toast.success("PDF exporté avec succès", { id: toastId });
  } catch (err) {
    console.error("[pdf-export] failed", err);
    toast.error("Échec de l'export PDF", {
      id: toastId,
      description: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Remplace les couleurs oklch/oklab par des fallbacks hex sûrs. */
function sanitizeColors(root: HTMLElement) {
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const node of all) {
    const cs = window.getComputedStyle(node);
    const fix = (val: string, fallback: string) =>
      /oklch|oklab|color\(/.test(val) ? fallback : val;

    node.style.color = fix(cs.color, "#0f172a");
    node.style.backgroundColor = fix(cs.backgroundColor, "transparent");
    node.style.borderColor = fix(cs.borderColor, "#e5e7eb");
    if (/oklch|oklab|color\(/.test(cs.backgroundImage)) {
      node.style.backgroundImage = "none";
    }
  }
}

function triggerPdfDownload(pdf: InstanceType<typeof jsPDF>, filename: string) {
  const safeFilename = sanitizePdfFilename(filename);
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function sanitizePdfFilename(filename: string) {
  const normalized = filename.trim().replace(/\.pdf$/i, "") || "document-dimdocs";
  return `${normalized.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-")}.pdf`;
}
