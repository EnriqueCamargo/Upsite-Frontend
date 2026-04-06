import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async subirArchivo(archivo: File): Promise<string> {
    const nombreArchivo = `${Date.now()}_${archivo.name}`;

    const { data, error } = await this.supabase.storage
      .from('multimedia')
      .upload(nombreArchivo, archivo);

    if (error) throw error;

    const { data: urlData } = this.supabase.storage
      .from('multimedia')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }
}