import { supabase } from '../lib/supabase';

export interface ShareLinkOptions {
  expiresAt?: string | null;
  accessType?: 'public' | 'password-protected';
  password?: string;
}

export interface ShareLink {
  id: string;
  organization_id: string;
  document_type: 'quote' | 'invoice';
  document_id: string;
  share_token: string;
  access_type: 'public' | 'password-protected';
  expires_at: string | null;
  password_hash: string | null;
  view_count: number;
  last_viewed_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareAnalytics {
  id: string;
  link_id: string;
  viewed_at: string;
  viewer_ip: string | null;
  user_agent: string | null;
  referrer: string | null;
}

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export const shareLinkService = {
  async generateShareLink(
    organizationId: string,
    documentType: 'quote' | 'invoice',
    documentId: string,
    userId: string,
    options: ShareLinkOptions = {}
  ): Promise<ShareLink> {
    const existingLink = await this.getExistingLink(documentType, documentId);

    if (existingLink) {
      return this.updateShareLink(existingLink.id, options);
    }

    const shareToken = generateSecureToken();
    const passwordHash = options.password ? await hashPassword(options.password) : null;

    const { data, error } = await supabase
      .from('shareable_links')
      .insert({
        organization_id: organizationId,
        document_type: documentType,
        document_id: documentId,
        share_token: shareToken,
        access_type: options.accessType || 'public',
        expires_at: options.expiresAt || null,
        password_hash: passwordHash,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getExistingLink(
    documentType: 'quote' | 'invoice',
    documentId: string
  ): Promise<ShareLink | null> {
    const { data, error } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('document_type', documentType)
      .eq('document_id', documentId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    const { data, error } = await supabase
      .from('shareable_links')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async validateLinkAccess(
    token: string,
    password?: string
  ): Promise<{ valid: boolean; link?: ShareLink; error?: string }> {
    const link = await this.getShareLinkByToken(token);

    if (!link) {
      return { valid: false, error: 'Link not found or inactive' };
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return { valid: false, error: 'Link has expired' };
    }

    if (link.access_type === 'password-protected') {
      if (!password) {
        return { valid: false, error: 'Password required' };
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== link.password_hash) {
        return { valid: false, error: 'Invalid password' };
      }
    }

    return { valid: true, link };
  },

  async updateShareLink(
    linkId: string,
    options: ShareLinkOptions
  ): Promise<ShareLink> {
    const updateData: any = {};

    if (options.accessType !== undefined) {
      updateData.access_type = options.accessType;
    }

    if (options.expiresAt !== undefined) {
      updateData.expires_at = options.expiresAt;
    }

    if (options.password !== undefined) {
      updateData.password_hash = options.password ? await hashPassword(options.password) : null;
      if (options.password) {
        updateData.access_type = 'password-protected';
      }
    }

    const { data, error } = await supabase
      .from('shareable_links')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async revokeShareLink(linkId: string): Promise<void> {
    const { error } = await supabase
      .from('shareable_links')
      .update({ is_active: false })
      .eq('id', linkId);

    if (error) throw error;
  },

  async trackLinkView(
    linkId: string,
    metadata: {
      viewer_ip?: string;
      user_agent?: string;
      referrer?: string;
    } = {}
  ): Promise<void> {
    await supabase
      .from('shareable_links')
      .update({
        view_count: supabase.raw('view_count + 1') as any,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    await supabase
      .from('share_analytics')
      .insert({
        link_id: linkId,
        viewer_ip: metadata.viewer_ip || null,
        user_agent: metadata.user_agent || null,
        referrer: metadata.referrer || null,
      });
  },

  async getShareAnalytics(linkId: string): Promise<ShareAnalytics[]> {
    const { data, error } = await supabase
      .from('share_analytics')
      .select('*')
      .eq('link_id', linkId)
      .order('viewed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getShareUrl(token: string, documentType: 'quote' | 'invoice'): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${documentType}/${token}`;
  },
};
