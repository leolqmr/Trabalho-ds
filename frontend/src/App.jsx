import { useEffect, useState } from 'react';

function App() {
  const [mensagem, setMensagem] = useState('Carregando...');

  useEffect(() => {
    fetch('http://localhost:3000')
      .then((res) => res.text())
      .then((data) => setMensagem(data))
      .catch((err) => setMensagem('Erro ao conectar com o Back-end'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Teste de Conexão</h1>
      <p>Resposta da API: <strong>{mensagem}</strong></p>
    </div>
  );
}

export default App;