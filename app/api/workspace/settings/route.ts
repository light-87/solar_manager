/**
 * Workspace Settings API
 *
 * Manages workspace-level settings including:
 * - Custom portal sites
 * - Custom materials list
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireWorkspaceId } from '@/lib/workspace-auth';

// Default portal sites
const DEFAULT_SITES = [
  'National Portal for Rooftop Solar (MNRE)',
  'PM Surya Ghar – Vendor Portal',
  'Maharashtra DISCOM (MSEDCL/MSEB) Rooftop Solar Vendor Portal',
];

// Default materials list
const DEFAULT_MATERIALS = [
  'Solar Panels',
  'Inverter',
  'Mounting Structure',
  'Wiring & Cables',
  'Junction Box',
  'MCB/MCCB',
  'Earthing Kit',
  'LA (Lightning Arrester)',
  'Net Meter',
  'Other Materials',
];

interface WorkspaceSettings {
  custom_sites?: string[];
  custom_materials?: string[];
  [key: string]: any;
}

/**
 * GET /api/workspace/settings
 * Fetch workspace settings (sites, materials, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const workspaceId = requireWorkspaceId(request);

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('code', workspaceId)
      .single();

    if (error) {
      console.error('Error fetching workspace settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workspace settings' },
        { status: 500 }
      );
    }

    const settings: WorkspaceSettings = workspace?.settings || {};

    // Merge defaults with custom settings
    const sites = [...DEFAULT_SITES, ...(settings.custom_sites || [])];
    const materials = [...DEFAULT_MATERIALS, ...(settings.custom_materials || [])];

    // Sort materials alphabetically (keeping defaults first, then custom alphabetically)
    const sortedMaterials = [
      ...DEFAULT_MATERIALS,
      ...(settings.custom_materials || []).sort((a: string, b: string) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' })
      ),
    ];

    return NextResponse.json({
      sites,
      materials: sortedMaterials,
      custom_sites: settings.custom_sites || [],
      custom_materials: settings.custom_materials || [],
      default_sites: DEFAULT_SITES,
      default_materials: DEFAULT_MATERIALS,
    });
  } catch (error) {
    console.error('Error in GET /api/workspace/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/workspace/settings
 * Add a new custom site or material
 */
export async function POST(request: NextRequest) {
  try {
    const workspaceId = requireWorkspaceId(request);
    const body = await request.json();

    const { type, value } = body;

    if (!type || !value) {
      return NextResponse.json(
        { error: 'Type and value are required' },
        { status: 400 }
      );
    }

    if (type !== 'site' && type !== 'material') {
      return NextResponse.json(
        { error: 'Type must be "site" or "material"' },
        { status: 400 }
      );
    }

    // Fetch current settings
    const { data: workspace, error: fetchError } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('code', workspaceId)
      .single();

    if (fetchError) {
      console.error('Error fetching workspace:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch workspace' },
        { status: 500 }
      );
    }

    const currentSettings: WorkspaceSettings = workspace?.settings || {};
    const fieldName = type === 'site' ? 'custom_sites' : 'custom_materials';
    const currentList: string[] = currentSettings[fieldName] || [];

    // Check for duplicates (case-insensitive)
    const valueNormalized = value.trim().toLowerCase();
    const defaults = type === 'site' ? DEFAULT_SITES : DEFAULT_MATERIALS;

    const existsInDefaults = defaults.some(
      (item) => item.toLowerCase() === valueNormalized
    );
    const existsInCustom = currentList.some(
      (item) => item.toLowerCase() === valueNormalized
    );

    if (existsInDefaults || existsInCustom) {
      return NextResponse.json(
        { error: `This ${type} already exists` },
        { status: 400 }
      );
    }

    // Add new value
    const updatedList = [...currentList, value.trim()];
    const updatedSettings = {
      ...currentSettings,
      [fieldName]: updatedList,
    };

    // Update workspace settings
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ settings: updatedSettings })
      .eq('code', workspaceId);

    if (updateError) {
      console.error('Error updating workspace settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update workspace settings' },
        { status: 500 }
      );
    }

    // Return updated lists
    const sites = [...DEFAULT_SITES, ...(updatedSettings.custom_sites || [])];
    const materials = [
      ...DEFAULT_MATERIALS,
      ...(updatedSettings.custom_materials || []).sort((a: string, b: string) =>
        a.localeCompare(b, 'en', { sensitivity: 'base' })
      ),
    ];

    return NextResponse.json({
      success: true,
      sites,
      materials,
      added: { type, value: value.trim() },
    });
  } catch (error) {
    console.error('Error in POST /api/workspace/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
