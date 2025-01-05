import { Conversation } from "@/types/types";
import { fetchConversations } from "@/utils/topic/topicService";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";

export function useConversations(user: User | null ) {
    const [conversations, setConversations ] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadConversations() {
            if (!user){
                setConversations([]);
                setLoading(false);
                return;
            }

            try { 
                const fetchedConversations = await fetchConversations(user);
                setConversations(fetchedConversations);
                setError(null);
            } catch (err) {
                setError('Failed to fetch conversations');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadConversations();
    }, [user]);

    return { conversations, loading, error, setConversations};
}