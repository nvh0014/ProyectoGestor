export const validarRegistro = (NombreUsuario, password, password2) => {
  const errores = [];

  if (!NombreUsuario || NombreUsuario.trim() === '') {
    errores.push('El campo "Nombre de usuario" es obligatorio.');
  }

  if (!password || password.trim() === '') {
    errores.push('El campo "Contraseña" es obligatorio.');
  }

  if (!password2 || password2.trim() === '') {
    errores.push('El campo "Confirme su contraseña" es obligatorio.');
  }

  if (password || password.trim() === '' || password2 || password2.trim() === '' ) {
    if (password !== password2){
      errores.push('Las contraseñas deben ser iguales.');
    }
  }
  
   if (password && password.length < 6) {
     errores.push('La contraseña debe tener al menos 6 caracteres.');
   }

  return errores;
};

// Función para validar RUT chileno
export const validarRUT = (rut) => {
    if (!rut) return false;
    
    // Limpiar formato
    rut = rut.replace(/[^0-9kK-]/g, '').toUpperCase();
    
    // Validar formato básico
    if (!/^[0-9]+[-|‐]{1}[0-9kK]{1}$/.test(rut)) {
        return false;
    }
    
    // Separar dígito verificador
    const [numeros, dv] = rut.split('-');
    
    // Validar largo
    if (numeros.length < 7 || numeros.length > 8) {
        return false;
    }
    
    // Calcular dígito verificador esperado
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numeros.length - 1; i >= 0; i--) {
        suma += parseInt(numeros.charAt(i)) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dvCalculado === dv;
};