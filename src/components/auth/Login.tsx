import React, { useState } from 'react';
import { supabase } from '../../lib/supabase'; // Restauramos la importación de Supabase

const Login: React.FC = () => { // Eliminamos la prop onLoginSuccess
  const [email, setEmail] = useState<string>('Exterminador@xestudio.ia');
  const [password, setPassword] = useState<string>('x.5_k2wl@)');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Removemos la lógica de login falso y restauramos la autenticación de Supabase
    try {
      // 1) Intentar iniciar sesión directamente
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 2) Si falla, intentar crear el usuario y volver a iniciar sesión
        console.warn('Login falló, intentando crear usuario y reintentar login...');
        const { data: signupData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });

        if (signUpError) {
          throw signUpError;
        }

        // Si el proyecto requiere confirmación por correo, informar al usuario
        if (signupData?.user && !signupData.user.confirmed_at) {
          setError('Cuenta creada. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
          return;
        }

        // 3) Reintentar login
        const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
        if (retryError) {
          throw retryError;
        }
      }

      console.log('Login successful:', data);
      // El onAuthStateChange en App.tsx manejará la redirección/actualización

    } catch (err: any) {
      console.error('Login error:', err);
      const msg = (err?.message || '').toLowerCase().includes('email address')
        ? 'El correo no es válido. Usa un dominio con TLD, por ejemplo @monitor.novai.mx'
        : (err.error_description || err.message || 'Error al iniciar sesión');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={styles.container}>
      <div className="login-form" style={styles.form}>
        <h2 style={styles.title}>Iniciar Sesión - Monitor Exterminador</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Usuario:</label>
            <input
              id="email"
              type="email" // Mantenemos type email por compatibilidad
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="Exterminador@xestudio.ia"
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Contraseña:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Iniciando...' : 'Entrar'}
          </button>
          <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Acceso rápido Exterminador: Exterminador@xestudio.ia / x.5_k2wl@)
          </div>
        </form>
      </div>
    </div>
  );
};

// Estilos básicos inline para simplicidad (puedes moverlos a CSS)
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-body-from)', // Usar variable de tema
  },
  form: {
    padding: '40px',
    backgroundColor: 'var(--bg-card)', // Usar variable de tema
    borderRadius: 'var(--radius-lg)', // Usar variable de tema
    boxShadow: 'var(--shadow-normal)', // Usar variable de tema
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '30px',
    color: 'var(--color-text)', // Usar variable de tema
    fontSize: '1.5rem',
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: 'var(--color-text-secondary)', // Usar variable de tema
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 'var(--radius-md)', // Usar variable de tema
    border: '1px solid var(--color-border)', // Usar variable de tema
    backgroundColor: 'var(--bg-surface)', // Usar variable de tema
    color: 'var(--color-text)', // Usar variable de tema
    fontSize: '1rem',
    boxSizing: 'border-box', // Asegurar padding correcto
  },
  button: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    backgroundColor: 'var(--color-primary)', // Usar variable de tema
    color: 'white',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '10px',
  },
  error: {
    color: '#f87171', // Color rojo para errores
    fontSize: '0.85rem',
    marginBottom: '15px',
  },
};

export default Login; 