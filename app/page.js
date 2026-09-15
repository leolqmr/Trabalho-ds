'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [presencas, setPresencas] = useState({})
  const [loading, setLoading] = useState(true)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    // Busca alunos e turmas do Supabase
    const { data: dadosAlunos } = await supabase.from('aluno').select('*')
    const { data: dadosTurmas } = await supabase.from('turmas').select('*')

    if (dadosAlunos) setAlunos(dadosAlunos)
    if (dadosTurmas) {
      setTurmas(dadosTurmas)
      if (dadosTurmas.length > 0) setTurmaSelecionada(dadosTurmas[0].id)
    }
    setLoading(false)
  }

  // Alterna a presença no estado local (Presente / Ausente)
  const togglePresenca = (alunoId) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: prev[alunoId] === 'AUSENTE' ? 'PRESENTE' : 'AUSENTE',
    }))
  }

  // Salva toda a chamada no Supabase
  async function salvarChamada() {
    if (!turmaSelecionada) return

    const dataHoje = new Date().toISOString().split('T')[0]
    
    // Monta a lista de chamadas
    const novosRegistros = alunos.map((aluno) => ({
      aluno_id: aluno.id,
      turma_id: Number(turmaSelecionada),
      data_aula: dataHoje,
      status: presencas[aluno.id] || 'PRESENTE', // Padrão PRESENTE
    }))

    const { error } = await supabase.from('presenca').insert(novosRegistros)

    if (error) {
      setMensagem('❌ Erro ao salvar chamada: ' + error.message)
    } else {
      setMensagem('✅ Chamada salva com sucesso no banco!')
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-xl">Carregando dados...</div>
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          📋 Controle de Frequência Teste
        </h1>

        {/* Seleção da Turma */}
        <div>
          <label className="block text-sm font-medium mb-1">Selecione a Turma:</label>
          <select
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.disciplina || t.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de Alunos */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Lista de Alunos</h2>
          {alunos.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Nenhum aluno cadastrado. Adicione alunos diretamente na tabela `alunos` no Supabase.
            </p>
          ) : (
            <div className="space-y-2">
              {alunos.map((aluno) => {
                const status = presencas[aluno.id] || 'PRESENTE'
                return (
                  <div
                    key={aluno.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="font-medium">{aluno.nome}</span>
                    <button
                      onClick={() => togglePresenca(aluno.id)}
                      className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-colors ${
                        status === 'PRESENTE'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {status}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Botão de Ação e Mensagem */}
        <button
          onClick={salvarChamada}
          disabled={alunos.length === 0}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
        >
          Salvar Chamada no Banco
        </button>

        {mensagem && (
          <div className="p-3 text-center rounded-lg text-sm font-medium bg-gray-100">
            {mensagem}
          </div>
        )}
      </div>
    </main>
  )
}