require('dotenv').config({ path: '.env.local' });
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const readline = require('readline');

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser(email, password, name, surname) {
  if (!email || !password || !name || !surname) {
    console.error('Todos los campos son obligatorios.');
    return;
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    return;
  }
  try {
    // Crear usuario admin
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, surname, role: 'admin' }
    });
    if (error) throw error;
    console.log('Usuario administrador creado:', data.user.email);

    // Insertar en la tabla users
    const userId = data.user.id;
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email,
          name,
          surname,
          role: 'admin'
        }
      ]);
    if (dbError) {
      console.error('Error insertando en tabla users:', dbError.message);
    } else {
      console.log('Usuario insertado en tabla users correctamente.');
    }
  } catch (err) {
    console.error('Error creando usuario:', err.message || err);
  }
}

function promptInput(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

async function mainInteractive() {
  const email = await promptInput('Email: ');
  const password = await promptInput('Contraseña: ');
  const name = await promptInput('Nombre: ');
  const surname = await promptInput('Apellido: ');
  await createAdminUser(email, password, name, surname);
}

// Permite usar el script por CLI: node crear-admin.js email password nombre apellido
if (require.main === module) {
  if (process.argv.length > 5) {
    const [,, email, password, name, surname] = process.argv;
    createAdminUser(email, password, name, surname);
  } else {
    mainInteractive();
  }
}