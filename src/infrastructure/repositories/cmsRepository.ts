import { supabase, supabasePublic } from '../clients/supabase';
import { parseLandingContent, type CMSContentDTO } from '../contracts/cms.contract';

export interface LandingContent {
    readonly id: string;
    readonly section: string;
    readonly key: string;
    readonly content: string;
    readonly type: string;
}

export async function getLandingContent(): Promise<readonly LandingContent[]> {
    const { data, error } = await supabasePublic
        .from('landing_content')
        .select('*')
        .order('section', { ascending: true });

    if (error) throw error;
    return parseLandingContent(data).map((row) => mapFromDb(row));
}

export async function updateContent(id: string, content: string): Promise<void> {
    const { error } = await supabase
        .from('landing_content')
        .update({ content })
        .eq('id', id);

    if (error) throw error;
}

function mapFromDb(row: CMSContentDTO): LandingContent {
    return {
        id: row.id,
        section: row.section,
        key: row.key,
        content: row.content || '',
        type: row.type || ''
    };
}
