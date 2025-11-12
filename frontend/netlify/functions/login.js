// netlify/functions/login.js
exports.handler = async (event) => {
    try {
      const body = JSON.parse(event.body);
      const { email, password } = body;
  
      // ✅ Credenciales fijas (solo para demo)
      if (email === "admin@empresa.com" && password === "AdminSeguro2025!") {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: 1,
            email: "admin@empresa.com",
            rol: "admin",
            activo: true,
            createdAt: "2024-11-01T08:00:00"
          })
        };
      }
  
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Credenciales inválidas" })
      };
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error interno" })
      };
    }
  };