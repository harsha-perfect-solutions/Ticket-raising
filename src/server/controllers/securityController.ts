import { Request, Response } from 'express';
import { getAntivirusMetrics, getScanResult, scanAttachmentAsync } from '../services/antivirusScanner';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/auditLogger';

export async function getAntivirusStats(req: Request, res: Response): Promise<void> {
  try {
    const metrics = getAntivirusMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch antivirus metrics', error: error.message });
  }
}

export async function getFileScanStatus(req: Request, res: Response): Promise<void> {
  try {
    const fileId = req.params.fileId as string;
    const result = getScanResult(fileId);
    res.json({
      success: true,
      scan: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch scan status', error: error.message });
  }
}

export async function triggerManualRescan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fileId = req.params.fileId as string;
    const existing = getScanResult(fileId);
    
    const reScanned = await scanAttachmentAsync({
      id: existing.fileId,
      fileName: existing.fileName,
      originalName: existing.fileName,
      filePath: existing.filePath,
      fileSize: existing.fileSize,
      mimeType: existing.mimeType,
    });

    if (req.user) {
      await logAuditEvent({
        userId: req.user.userId,
        action: 'ANTIVIRUS_MANUAL_RESCAN',
        entityType: 'Attachment',
        entityId: fileId,
        details: `Manual Antivirus Re-scan completed with result: ${reScanned.status}`,
        req,
      });
    }

    res.json({
      success: true,
      message: 'Attachment re-scan completed successfully.',
      scan: reScanned,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Manual re-scan failed', error: error.message });
  }
}
