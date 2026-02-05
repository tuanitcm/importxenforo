import { XFConfig } from '../types';

interface XFResponse {
  success: boolean;
  resource?: {
      resource_id: number;
      title: string;
  };
  errors?: { code: string; message: string; }[];
}

// Helper to construct endpoint based on proxy settings
const getEndpoint = (baseUrl: string, path: string, config: XFConfig) => {
    let url = `${baseUrl.replace(/\/+$/, '')}${path}`;
    if (config.allowCorsProxy) {
        // Use the custom proxy URL.
        const proxyBase = config.proxyUrl || 'https://corsproxy.io/?';
        return proxyBase + encodeURIComponent(url);
    }
    return url;
};

// Helper to build headers
const getHeaders = (config: XFConfig): HeadersInit => {
    const headers: any = {
        'XF-Api-Key': config.apiKey,
        'Accept': 'application/json',
    };

    // OPTIMIZATION: Only send X-Requested-With if NOT using a proxy.
    // Sending this header via a public Proxy often triggers Cloudflare WAF because it looks like a bot trying to fake a browser.
    // XenForo API works fine without it if API Key is valid.
    if (!config.allowCorsProxy) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    // CRITICAL: Tells XF which user is performing the action.
    if (config.userId && config.userId > 0) {
        headers['XF-Api-User'] = config.userId.toString();
    }

    return headers;
};

export const testConnection = async (config: XFConfig): Promise<{ success: boolean; message: string; categoryName?: string }> => {
    const endpoint = getEndpoint(config.baseUrl, `/api/resource-categories/${config.categoryId}/`, config);
    
    if (!config.allowCorsProxy && typeof window !== 'undefined' && window.location.protocol === 'https:' && config.baseUrl.startsWith('http:')) {
        return {
            success: false,
            message: 'Lỗi bảo mật: Không thể gọi API HTTP từ trang HTTPS. Vui lòng bật "Enable CORS Proxy".'
        };
    }

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: getHeaders(config),
        });

        // Handle specific Proxy Blocking errors
        if (config.allowCorsProxy && (response.status === 403 || response.status === 503 || response.status === 429)) {
             return {
                success: false,
                message: `PROXY_BLOCKED` // Special code to trigger UI guide
            };
        }

        const textResult = await response.text();
        let json;
        try {
            json = JSON.parse(textResult);
        } catch (e) {
            return {
                success: false,
                message: `Server trả về dữ liệu rác (HTML thay vì JSON). Có thể do Proxy trả về trang lỗi.`
            };
        }

        if (!response.ok) {
            if (response.status === 404) {
                return { success: false, message: `Kết nối được nhưng không tìm thấy Category ID: ${config.categoryId}.` };
            }
            if (response.status === 401 || response.status === 403) {
                return { success: false, message: `Lỗi quyền (401/403). Kiểm tra API Key và User ID.` };
            }
            const errorMsg = json.errors?.[0]?.message || 'Lỗi không xác định';
            return { success: false, message: `Lỗi API (${response.status}): ${errorMsg}` };
        }

        if (json.category) {
            return { success: true, message: `Kết nối thành công!`, categoryName: json.category.title };
        } else {
             return { success: false, message: 'Phản hồi lạ: Không tìm thấy dữ liệu category.' };
        }

    } catch (error: any) {
        let msg = error.message;
        if (msg === 'Failed to fetch') {
            msg = config.allowCorsProxy 
                ? 'PROXY_BLOCKED' // Treat network fail via proxy as blocked
                : 'CORS_ERROR'; // Treat network fail direct as CORS
        }
        return { success: false, message: msg };
    }
};

export const postResource = async (
  config: XFConfig,
  data: URLSearchParams
): Promise<XFResponse> => {
  const endpoint = getEndpoint(config.baseUrl, '/api/resources/', config);
  
  if (!config.allowCorsProxy && typeof window !== 'undefined' && window.location.protocol === 'https:' && config.baseUrl.startsWith('http:')) {
      return {
          success: false,
          errors: [{ 
              code: 'mixed_content', 
              message: 'Lỗi bảo mật: Không thể gọi API HTTP từ trang HTTPS.' 
          }]
      };
  }

  try {
    const headers = {
        ...getHeaders(config),
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers as HeadersInit,
      body: data,
    });

    const textResult = await response.text();
    let json;
    try {
        json = JSON.parse(textResult);
    } catch (e) {
        return {
            success: false,
            errors: [{ 
                code: 'invalid_response', 
                message: `Server không trả về JSON (Status: ${response.status}).` 
            }]
        };
    }
    
    if (!response.ok) {
        const errorList = json.errors || [];
        const errorMessages = errorList.map((e: any) => e.message || JSON.stringify(e));
        
        return {
            success: false,
            errors: errorList.length > 0 ? errorList : [{ 
                code: 'http_error', 
                message: `Lỗi HTTP ${response.status}: ${errorMessages.join(', ')}` 
            }]
        };
    }

    return { success: true, resource: json.resource };

  } catch (error: any) {
    let msg = error.message || 'Lỗi mạng không xác định.';
    if (msg === 'Failed to fetch') {
        msg = config.allowCorsProxy ? 'Lỗi Proxy/Firewall chặn kết nối.' : 'Lỗi CORS. Hãy bật Proxy.';
    }
    return {
      success: false,
      errors: [{ code: 'network_error', message: msg }]
    };
  }
};