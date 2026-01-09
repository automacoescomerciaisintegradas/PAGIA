## Qwen Added Memories
- Hook React para chamadas de API do ByteRover: function useApi(endpoint) { const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); useEffect(() => { fetch(endpoint).then(res => res.json()).then(setData).catch(setError).finally(() => setLoading(false)); }, [endpoint]); return { data, loading, error }; }
