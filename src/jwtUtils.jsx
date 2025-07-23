const API_BASE = process.env.REACT_APP_API_BASE_URL;

export async function refreshAccessToken(updateAccessToken) {
    try {
        const response = await fetch(`${API_BASE}/api/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // para enviar cookie HttpOnly
        });

        if (!response.ok) {
            throw new Error('No se pudo refrescar el token');
        }

        const data = await response.json();

        if (data.access_token) {
            updateAccessToken(data.access_token); // actualizar en contexto o estado
            console.log("Token de acceso refrescado:", data.access_token);
            return data.access_token;
        }

        return null;
    } catch (error) {
        console.error('Error al refrescar el token:', error);
        return null;
    }
}
