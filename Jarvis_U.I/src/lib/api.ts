import {
    CognitoUserPool,
    CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID as string,
    ClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID as string,
});

/** Recupera o ID Token JWT da sessão Cognito ativa. */
async function getIdToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        const user = userPool.getCurrentUser();
        if (!user) { reject(new Error("Sem sessão ativa")); return; }
        user.getSession((err: Error | null, session: CognitoUserSession | null) => {
            if (err || !session?.isValid()) { reject(err ?? new Error("Sessão inválida")); return; }
            resolve(session.getIdToken().getJwtToken());
        });
    });
}

/** Retorna os headers base com Authorization injetado. */
async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getIdToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}

export type Task = {
    id: string;
    description: string;
    status: 'todo' | 'doing' | 'blocked' | 'done' | 'scheduled';
    priority?: 'low' | 'medium' | 'high';
    context?: 'work' | 'personal' | 'study';
    createdAt?: string;
};

const WEBHOOK_URL = "http://54.235.133.99:5678/webhook/tasks";

// Helper interface for raw API response from n8n (Portuguese keys)
interface ApiTask {
    id: string | number;
    title?: string;
    description?: string;
    status?: string;
    prioridade?: string;
    priority?: string;
    frente?: string;
    context?: string;
    criadoEm?: string;
    createdAt?: string;
    [key: string]: any;
}

const sanitizeTask = (raw: ApiTask): Task => {
    // Map Priority (PT -> EN)
    let priority: Task['priority'] = 'medium';
    const rawPriority = (raw.prioridade || raw.priority || '').toLowerCase();
    if (rawPriority.includes('alta') || rawPriority.includes('high')) priority = 'high';
    else if (rawPriority.includes('baixa') || rawPriority.includes('low')) priority = 'low';

    // Map Status
    let status: Task['status'] = 'todo';
    const rawStatus = (raw.status || '').toLowerCase();
    if (['agendado', 'scheduled', 'future', 'backlog'].some(s => rawStatus.includes(s))) {
        status = 'scheduled';
    } else if (['todo', 'doing', 'blocked', 'done'].includes(rawStatus)) {
        status = rawStatus as Task['status'];
    } else if (rawStatus) {
        console.warn(`⚠️ Status inválido: "${rawStatus}". Fallback: "todo"`);
    }

    // Map Context
    let context: Task['context'] = 'work';
    const rawContext = (raw.frente || raw.context || '').toLowerCase();
    if (['work', 'personal', 'study'].includes(rawContext)) {
        context = rawContext as Task['context'];
    } else if (rawContext) {
        console.warn(`⚠️ Context inválido: "${rawContext}". Fallback: "work"`);
    }

    return {
        id: String(raw.id),
        description: raw.title || raw.description || 'Sem descrição',
        status,
        priority,
        context,
        createdAt: raw.criadoEm || raw.createdAt || new Date().toISOString()
    };
};

export const api = {
    fetchTasks: async (): Promise<Task[]> => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(WEBHOOK_URL, { method: "GET", headers });
            if (!res.ok) throw new Error("Failed to fetch tasks");

            const data = await res.json();
            let rawList: ApiTask[] = Array.isArray(data) ? data : (data ? [data] : []);
            return rawList.map(sanitizeTask);
        } catch (error) {
            console.error("API Error (fetchTasks):", error);
            return [];
        }
    },

    createTask: async (description: string) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ description, sessionId: "bruno_session_01" }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        const text = await res.text();
        return text ? JSON.parse(text) : { success: true };
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ id, ...updates }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        return await res.json();
    },

    deleteTask: async (id: string) => {
        const headers = await getAuthHeaders();
        const res = await fetch(WEBHOOK_URL, {
            method: "DELETE",
            headers,
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Failed to delete task");
        return await res.json();
    },
};
