import multer from "multer";
import { Readable } from "stream";
import express from 'express';
import { google } from 'googleapis';
import { db } from './db.js';
import { requireAuth, AuthRequest } from './authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Base URL handling for local vs cloud environment
const getBaseUrl = (req: express.Request) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
};

const getOAuth2Client = (req: express.Request) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${getBaseUrl(req)}/api/drives/google/callback`
  );
};

// 1. Initiate OAuth
router.get('/google/connect', requireAuth, async (req: AuthRequest, res) => {
  try {
    const drivesSnapshot = await db.collection('drives')
      .where('user_id', '==', req.user.id)
      .where('provider', '==', 'google')
      .get();

    if (drivesSnapshot.size >= 5) {
      return res.redirect('/drives?error=' + encodeURIComponent('Maximum of 5 Google Drive accounts reached.'));
    }

    const oauth2Client = getOAuth2Client(req);
    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: req.user.id
    });
    res.redirect(url);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    res.redirect('/drives?error=' + encodeURIComponent('Failed to initiate connection.'));
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;

    if (error) {
      console.error('OAuth error from Google:', error);
      return res.redirect('/drives?error=' + encodeURIComponent(error as string));
    }

    if (!code || !state) {
      return res.redirect('/drives?error=' + encodeURIComponent('Missing code or state'));
    }

    const userId = state as string;

    const drivesSnapshot = await db.collection('drives')
      .where('user_id', '==', userId)
      .where('provider', '==', 'google')
      .get();

    if (drivesSnapshot.size >= 5) {
      return res.redirect('/drives?error=' + encodeURIComponent('Maximum of 5 Google Drive accounts reached.'));
    }

    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const providerAccountId = userInfo.data.id;
    const email = userInfo.data.email;
    const name = userInfo.data.name;
    const avatar = userInfo.data.picture;

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const about = await drive.about.get({ fields: 'storageQuota' });

    const quota = about.data.storageQuota;
    const totalSpace = parseInt(quota?.limit || '0', 10);
    const usedSpace = parseInt(quota?.usage || '0', 10);

    const existingDriveSnapshot = await db.collection('drives')
      .where('user_id', '==', userId)
      .where('provider', '==', 'google')
      .where('provider_account_id', '==', providerAccountId)
      .get();

    const newDriveData = {
      user_id: userId,
      provider: 'google',
      provider_account_id: providerAccountId,
      email: email,
      name: name,
      avatar_url: avatar,
      access_token: tokens.access_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      used_space: usedSpace,
      total_space: totalSpace,
      status: 'healthy',
      last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;

    if (!existingDriveSnapshot.empty) {
      const existingDoc = existingDriveSnapshot.docs[0];
      newDriveData.refresh_token = tokens.refresh_token || existingDoc.data().refresh_token;
      await existingDoc.ref.update(newDriveData);
    } else {
      newDriveData.refresh_token = tokens.refresh_token;
      newDriveData.created_at = new Date().toISOString();
      const newRef = db.collection('drives').doc();
      newDriveData.id = newRef.id;
      await newRef.set(newDriveData);
    }

    res.redirect('/drives?connected=true');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect('/drives?error=' + encodeURIComponent('Failed to connect to Google Drive.'));
  }
});
// 3. Get User Drives
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const drivesSnapshot = await db.collection('drives').where('user_id', '==', req.user!.id).get();
    const sanitizedDrives = drivesSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: d.id || doc.id,
        provider: d.provider,
        provider_account_id: d.provider_account_id,
        email: d.email,
        name: d.name,
        avatar_url: d.avatar_url,
        used_space: d.used_space,
        total_space: d.total_space,
        status: d.status,
        last_sync: d.last_sync
      };
    });
    res.json({ drives: sanitizedDrives });
  } catch (error) {
    console.error('Error fetching drives:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create resumable upload session
router.post('/:id/upload/session', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, mimeType, parentId, size } = req.body;
    
    if (!name || !mimeType) {
      return res.status(400).json({ error: 'Missing name or mimeType' });
    }

    const driveDoc = await db.collection('drives').doc(id).get();
    if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
    const driveRecord = driveDoc.data()!;
    if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

    if (req.user!.id === 'demo-user-id') {
      return res.json({ uploadUrl: 'mock-upload-url' });
    }

    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({
      access_token: driveRecord.access_token,
      refresh_token: driveRecord.refresh_token,
    });

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driveRecord.access_token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': size.toString(),
        'X-Upload-Content-Type': mimeType
      },
      body: JSON.stringify({
        name,
        parents: parentId && parentId !== 'root' ? [parentId] : []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create upload session:', errorText);
      return res.status(response.status).json({ error: 'Failed to create upload session' });
    }

    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) {
      return res.status(500).json({ error: 'No upload URL returned from Google' });
    }

    res.json({ uploadUrl });
  } catch (err) {
    console.error('Upload session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search across all drives
router.get('/search/all', requireAuth, async (req: AuthRequest, res) => {
  const query = req.query.q as string;
  if (!query) return res.json({ results: [] });

  const drivesSnapshot = await db.collection('drives').where('user_id', '==', req.user!.id).where('provider', '==', 'google').get();
  
  let allResults: any[] = [];
  
  for (const doc of drivesSnapshot.docs) {
    const driveRecord = doc.data();
    if (req.user!.id === 'demo-user-id') {
      allResults.push(
        { id: '1', name: `Demo Result matching "${query}"`, mimeType: 'application/pdf', driveName: driveRecord.name, webViewLink: '#' },
        { id: '2', name: `Folder with "${query}"`, mimeType: 'application/vnd.google-apps.folder', driveName: driveRecord.name, webViewLink: '#' }
      );
      continue;
    }

    try {
      const oauth2Client = getOAuth2Client(req);
      oauth2Client.setCredentials({
        access_token: driveRecord.access_token,
        refresh_token: driveRecord.refresh_token,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      const response = await drive.files.list({
        q: `name contains '${query.replace(/'/g, "\'")}' and trashed = false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        pageSize: 10
      });

      const files = response.data.files?.map(f => ({ ...f, driveName: driveRecord.name })) || [];
      allResults = [...allResults, ...files];
    } catch (err) {
      console.error(`Search failed for drive ${driveRecord.id}`, err);
    }
  }

  res.json({ results: allResults });
});

// Cross-drive queries
router.get('/all/:mode', requireAuth, async (req: AuthRequest, res) => {
  const { mode } = req.params;
  const drivesSnapshot = await db.collection('drives').where('user_id', '==', req.user!.id).where('provider', '==', 'google').get();
  
  if (req.user!.id === 'demo-user-id') {
    return res.json({
      files: [
        { id: '1', name: `Demo ${mode} file 1`, mimeType: 'application/pdf', driveName: 'Demo Drive', webViewLink: '#', modifiedTime: new Date().toISOString() },
        { id: '2', name: `Demo ${mode} image`, mimeType: 'image/jpeg', driveName: 'Demo Drive', webViewLink: '#', modifiedTime: new Date().toISOString() }
      ]
    });
  }

  try {
    const promises = drivesSnapshot.docs.map(async (doc) => {
      const driveRecord = doc.data();
      try {
        const oauth2Client = getOAuth2Client(req);
        oauth2Client.setCredentials({
          access_token: driveRecord.access_token,
          refresh_token: driveRecord.refresh_token,
        });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        let q = '';
        let orderBy = '';
        switch(mode) {
          case 'recent':
            q = 'trashed = false';
            orderBy = 'modifiedTime desc';
            break;
          case 'starred':
            q = 'starred = true and trashed = false';
            orderBy = 'modifiedTime desc';
            break;
          case 'trash':
            q = 'trashed = true';
            orderBy = 'modifiedTime desc';
            break;
          case 'shared':
            q = 'sharedWithMe = true and trashed = false';
            orderBy = 'sharedWithMeTime desc';
            break;
          case 'all':
            q = 'trashed = false';
            orderBy = 'modifiedTime desc';
            break;
          default:
            return [];
        }

        const response = await drive.files.list({
          q,
          orderBy,
          fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, owners)',
          pageSize: 20
        });

        return (response.data.files || []).map(f => ({ ...f, driveName: driveRecord.name, driveId: driveRecord.id || doc.id }));
      } catch (err) {
        console.error(`Query failed for drive ${driveRecord.id}`, err);
        return [];
      }
    });

    const resultsArray = await Promise.all(promises);
    let allFiles = resultsArray.flat();
    
    allFiles.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
    
    res.json({ files: allFiles.slice(0, 50) });
  } catch (err) {
    console.error('Cross-drive query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics: Find Duplicates
router.get('/analytics/duplicates', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.id === 'demo-user-id') {
    return res.json({
      duplicates: [
        {
          name: 'Project_Proposal_Final.pdf',
          size: 2450000,
          files: [
            { id: '101', driveName: 'Personal Drive (Google)' },
            { id: '102', driveName: 'Work Drive (Google)' }
          ]
        },
        {
          name: 'IMG_4892.jpg',
          size: 4200000,
          files: [
            { id: '201', driveName: 'Personal Drive (Google)' },
            { id: '202', driveName: 'Personal Drive (Google)' }
          ]
        }
      ]
    });
  }
  res.json({ duplicates: [] });
});

// Upload a file
router.post('/:id/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { folderId = 'root' } = req.body;
  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  if (req.user!.id === 'demo-user-id') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return res.json({ success: true, message: 'File uploaded (demo)' });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({
      access_token: driveRecord.access_token,
      refresh_token: driveRecord.refresh_token,
      expiry_date: driveRecord.expires_at ? new Date(driveRecord.expires_at).getTime() : null
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const fileMetadata = { name: req.file.originalname, parents: [folderId] };
    const media = { mimeType: req.file.mimetype, body: bufferStream };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink'
    });

    res.json({ success: true, file: response.data });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete a file
router.delete('/:id/files/:fileId', requireAuth, async (req: AuthRequest, res) => {
  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  if (req.user!.id === 'demo-user-id') return res.json({ success: true });

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({ access_token: driveRecord.access_token, refresh_token: driveRecord.refresh_token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    await drive.files.update({
      fileId: req.params.fileId,
      requestBody: { trashed: true }
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete file', details: error.message });
  }
});

// Rename a file
router.patch('/:id/files/:fileId/rename', requireAuth, async (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'New name is required' });

  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  if (req.user!.id === 'demo-user-id') return res.json({ success: true });

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({ access_token: driveRecord.access_token, refresh_token: driveRecord.refresh_token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    await drive.files.update({ fileId: req.params.fileId, requestBody: { name } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// Create folder
router.post('/:id/folders', requireAuth, async (req: AuthRequest, res) => {
  const { name, parentId = 'root' } = req.body;
  if (!name) return res.status(400).json({ error: 'Folder name is required' });

  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  if (req.user!.id === 'demo-user-id') {
    return res.json({ success: true, folder: { id: Date.now().toString(), name, mimeType: 'application/vnd.google-apps.folder', modifiedTime: new Date().toISOString() } });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({ access_token: driveRecord.access_token, refresh_token: driveRecord.refresh_token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const response = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
      fields: 'id, name, mimeType, modifiedTime'
    });
    
    res.json({ success: true, folder: response.data });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Download a file
router.get('/:id/files/:fileId/download', requireAuth, async (req: AuthRequest, res) => {
  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });
  
  if (req.user!.id === 'demo-user-id') {
     return res.status(404).json({ error: 'Demo user cannot download actual files.' });
  }
  
  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({ access_token: driveRecord.access_token, refresh_token: driveRecord.refresh_token });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const file = await drive.files.get({ fileId: req.params.fileId, fields: 'name, mimeType' });
    
    if (file.data.mimeType?.includes('application/vnd.google-apps.')) {
      return res.status(400).json({ error: 'Cannot directly download Google Workspace documents. Please open them in Drive.' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.data.name}"`);
    
    const response = await drive.files.get({ fileId: req.params.fileId, alt: 'media' }, { responseType: 'stream' });
    
    response.data
      .on('end', () => {})
      .on('error', (err: any) => {
        console.error('Error downloading file:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
      
  } catch (error: any) {
    console.error('Download error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to download file' });
  }
});

// 4. Disconnect Drive
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const driveDoc = await db.collection('drives').doc(req.params.id).get();
    if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
    const driveRecord = driveDoc.data()!;
    if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

    await driveDoc.ref.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting drive:', error);
    res.status(500).json({ error: 'Failed to disconnect drive' });
  }
});

// 5. Refresh Drive Quota
router.post('/:id/sync', requireAuth, async (req: AuthRequest, res) => {
  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  let driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  if (req.user!.id === 'demo-user-id') {
    await new Promise(resolve => setTimeout(resolve, 500));
    driveRecord.used_space = (driveRecord.used_space || 0) + Math.floor(Math.random() * 10000000);
    driveRecord.last_sync = new Date().toISOString();
    driveRecord.status = 'healthy';
    return res.json({ success: true, drive: driveRecord });
  }

  if (driveRecord.provider !== 'google') {
    return res.status(400).json({ error: 'Unsupported provider' });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({
      access_token: driveRecord.access_token,
      refresh_token: driveRecord.refresh_token,
      expiry_date: driveRecord.expires_at ? new Date(driveRecord.expires_at).getTime() : null
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const about = await drive.about.get({ fields: 'storageQuota' });
    
    const quota = about.data.storageQuota;
    const totalSpace = parseInt(quota?.limit || '0', 10);
    const usedSpace = parseInt(quota?.usage || '0', 10);

    const updateData: any = {
      used_space: usedSpace,
      total_space: totalSpace,
      last_sync: new Date().toISOString(),
      status: 'healthy'
    };

    const newCredentials = oauth2Client.credentials;
    if (newCredentials.access_token) updateData.access_token = newCredentials.access_token;
    if (newCredentials.refresh_token) updateData.refresh_token = newCredentials.refresh_token;
    if (newCredentials.expiry_date) updateData.expires_at = new Date(newCredentials.expiry_date).toISOString();

    await driveDoc.ref.update(updateData);
    driveRecord = { ...driveRecord, ...updateData };
    
    res.json({ success: true, drive: driveRecord });
  } catch (error: any) {
    console.error('Error syncing drive:', error);
    await driveDoc.ref.update({ status: 'error' });
    res.status(500).json({ error: 'Failed to sync drive', status: 'error' });
  }
});

// 6. List Files
router.get('/:id/files', requireAuth, async (req: AuthRequest, res) => {
  const driveDoc = await db.collection('drives').doc(req.params.id).get();
  if (!driveDoc.exists) return res.status(404).json({ error: 'Drive not found' });
  const driveRecord = driveDoc.data()!;
  if (driveRecord.user_id !== req.user!.id) return res.status(404).json({ error: 'Drive not found' });

  const { folderId = 'root', pageToken, sortBy = 'name', sortDir = 'asc', filter = 'all' } = req.query;

  if (req.user!.id === 'demo-user-id') {
    const mockFiles = [];
    if (folderId === 'root') {
      mockFiles.push(
        { id: 'folder1', name: 'Work Documents', mimeType: 'application/vnd.google-apps.folder', modifiedTime: new Date().toISOString() },
        { id: 'folder2', name: 'Family Photos', mimeType: 'application/vnd.google-apps.folder', modifiedTime: new Date().toISOString() },
        { id: 'file1', name: 'Project_Proposal.pdf', mimeType: 'application/pdf', size: '1024000', modifiedTime: new Date().toISOString() },
        { id: 'file2', name: 'Vacation.jpg', mimeType: 'image/jpeg', size: '5000000', modifiedTime: new Date().toISOString(), thumbnailLink: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=200' },
        { id: 'file3', name: 'Q4_Financials.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '250000', modifiedTime: new Date().toISOString() }
      );
    } else {
      mockFiles.push(
        { id: `file-${folderId}-1`, name: `Inside_${folderId}_1.txt`, mimeType: 'text/plain', size: '5000', modifiedTime: new Date().toISOString() },
        { id: `file-${folderId}-2`, name: `Inside_${folderId}_2.png`, mimeType: 'image/png', size: '200000', modifiedTime: new Date().toISOString(), thumbnailLink: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=200' }
      );
    }
    
    mockFiles.sort((a, b) => {
      if (a.mimeType.includes('folder') && !b.mimeType.includes('folder')) return -1;
      if (!a.mimeType.includes('folder') && b.mimeType.includes('folder')) return 1;
      return a.name.localeCompare(b.name) * (sortDir === 'asc' ? 1 : -1);
    });

    return res.json({ files: mockFiles, nextPageToken: null });
  }

  if (driveRecord.provider !== 'google') return res.status(400).json({ error: 'Unsupported provider' });

  try {
    const oauth2Client = getOAuth2Client(req);
    oauth2Client.setCredentials({
      access_token: driveRecord.access_token,
      refresh_token: driveRecord.refresh_token,
      expiry_date: driveRecord.expires_at ? new Date(driveRecord.expires_at).getTime() : null
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let q = `'${folderId}' in parents and trashed = false`;
    if (filter === 'images') q += ` and mimeType contains 'image/'`;
    else if (filter === 'videos') q += ` and mimeType contains 'video/'`;
    else if (filter === 'documents') q += ` and (mimeType contains 'application/vnd.google-apps.document' or mimeType contains 'application/pdf' or mimeType contains 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`;
    else if (filter === 'audio') q += ` and mimeType contains 'audio/'`;
    else if (filter === 'archives') q += ` and (mimeType contains 'application/zip' or mimeType contains 'application/x-rar-compressed' or mimeType contains 'application/x-tar')`;
    else if (filter === 'other') q += ` and not mimeType contains 'image/' and not mimeType contains 'video/' and not mimeType contains 'audio/' and not mimeType contains 'application/vnd.google-apps.folder'`;

    let orderBy = 'folder,name';
    if (sortBy === 'name') orderBy = `folder,name ${sortDir}`;
    if (sortBy === 'date') orderBy = `folder,modifiedTime ${sortDir}`;
    if (sortBy === 'size') orderBy = `folder,quotaBytesUsed ${sortDir}`;
    if (sortBy === 'type') orderBy = `folder,mimeType ${sortDir},name asc`;

    const response = await drive.files.list({
      q,
      orderBy,
      pageSize: 50,
      pageToken: pageToken as string,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, owners, parents, webViewLink, webContentLink)'
    });

    const newCredentials = oauth2Client.credentials;
    const updateData: any = {};
    if (newCredentials.access_token) updateData.access_token = newCredentials.access_token;
    if (newCredentials.refresh_token) updateData.refresh_token = newCredentials.refresh_token;
    if (newCredentials.expiry_date) updateData.expires_at = new Date(newCredentials.expiry_date).toISOString();
    
    if (Object.keys(updateData).length > 0) {
      await driveDoc.ref.update(updateData);
    }

    res.json({
      files: response.data.files,
      nextPageToken: response.data.nextPageToken
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
