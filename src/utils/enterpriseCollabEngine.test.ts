import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  PRIMARY_SUPER_ADMIN_ACCOUNT,
  isSuperAdminGmModeratorAccount,
  getAccountAuthorityProfile,
  executeAdminGmModAction,
  INITIAL_TIMESTAMPED_COMMENTS,
  INITIAL_MERGE_CONFLICTS,
  INITIAL_CLOUD_CONNECTORS,
  INITIAL_E2EE_CONFIG,
  exportNleTimelineXml,
  exportCmx3600Edl,
} from './enterpriseCollabEngine.ts';

test('enterpriseCollabEngine: provides initial timestamped comments, CRDT conflicts, E2EE config, and cloud connectors', () => {
  assert.ok(INITIAL_TIMESTAMPED_COMMENTS.length >= 3);
  assert.ok(INITIAL_MERGE_CONFLICTS.length >= 2);
  assert.equal(INITIAL_CLOUD_CONNECTORS.length, 2);
  assert.equal(INITIAL_E2EE_CONFIG.enabled, true);
  assert.ok(INITIAL_E2EE_CONFIG.cipherSuite.includes('AES-256-GCM'));
});

test('exportNleTimelineXml and exportCmx3600Edl: generate valid FCPXML and CMX 3600 EDL interchange strings', () => {
  const xml = exportNleTimelineXml('Neon_Odyssey_32K_Master', 1000, 32000, 32000);
  assert.ok(xml.includes('<xmeml version="5">'));
  assert.ok(xml.includes('Neon_Odyssey_32K_Master'));
  assert.ok(xml.includes('<width>32000</width>'));

  const edl = exportCmx3600Edl('Neon_Odyssey_32K_Master');
  assert.ok(edl.includes('TITLE: NEON_ODYSSEY_32K_MASTER'));
  assert.ok(edl.includes('FCM: NON-DROP FRAME'));
  assert.ok(edl.includes('ARRI_32K_OMNIMAX_PLATE_CAM_A_1000FPS.EXR'));
});

test('creatergame31@gmail.com has full Administration, GM, Admin, Moderator control and official contact authority', () => {
  assert.equal(PRIMARY_SUPER_ADMIN_EMAIL, 'creatergame31@gmail.com');
  assert.equal(isSuperAdminGmModeratorAccount('creatergame31@gmail.com'), true);
  assert.equal(isSuperAdminGmModeratorAccount('  CREATERGAME31@GMAIL.COM '), true);
  assert.equal(isSuperAdminGmModeratorAccount('guest@example.com'), false);

  const profile = getAccountAuthorityProfile('creatergame31@gmail.com');
  assert.equal(profile.email, 'creatergame31@gmail.com');
  assert.deepEqual(profile.roles, ['Administration', 'GM', 'Admin', 'Moderator', 'Owner']);
  assert.equal(profile.permissions.fullSystemAdministration, true);
  assert.equal(profile.permissions.gmClusterOverride, true);
  assert.equal(profile.permissions.adminRbacControl, true);
  assert.equal(profile.permissions.moderatorContentAndQueueControl, true);
  assert.equal(profile.permissions.unlimitedEnterpriseQuota, true);
  assert.equal(profile.contact.primaryAdminEmail, 'creatergame31@gmail.com');
  assert.equal(profile.contact.gmEscalationEmail, 'creatergame31@gmail.com');
  assert.equal(profile.contact.moderatorContactEmail, 'creatergame31@gmail.com');
  assert.ok(profile.contact.directMailtoHref.startsWith('mailto:creatergame31@gmail.com'));

  const audit = executeAdminGmModAction('gm_cluster_override', '8-Node GPU Cluster', 'creatergame31@gmail.com');
  assert.equal(audit.actorEmail, 'creatergame31@gmail.com');
  assert.deepEqual(audit.actorRoles, ['Administration', 'GM', 'Admin', 'Moderator']);
  assert.ok(audit.summary.includes('8-Node GPU Cluster'));
});

