'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState('chamada') // 'chamada', 'aluno' ou 'turma'
  
  // Estados para dados do banco
  const [alunos, setAlunos] = useState([])
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [presencas, setPresencas] = useState({})
  
  // Estados para formulários
  const [novoAlunoNome, setNovoAlunoNome] = useState('')
  const [novoAlunoMatricula, setNovoAlunoMatricula] = useState('')
  
  const [novaTurmaNome, setNovaTurmaNome] = useState('')
  const [novaTurmaCodigo, setNovaTurmaCodigo] = useState('')

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    // Busca alunos e turmas no Supabase (respeitando nomes no singular/plural do banco)
    const { data: dadosAlunos } = await supabase.from('aluno').select('*')
    const { data: dadosTurmas } = await supabase.from('turmas').select('*')

    if (dadosAlunos) setAlunos(dadosAlunos)
    if (dadosTurmas) {
      setTurmas(dadosTurmas)
      if (dadosTurmas.length > 0 && !turmaSelecionada) {
        setTurmaSelecionada(dadosTurmas[0].id)
      }
    }
    setLoading(false)
  }

  // Função para cadastrar novo aluno no Supabase
  async function cadastrarAluno(e) {
    e.preventDefault()
    if (!novoAlunoNome || !novoAlunoMatricula) return

    setSalvando(true)
    const { error } = await supabase.from('aluno').insert([
      { nome: novoAlunoNome, matricula: novoAlunoMatricula }
    ])

    if (error) {
      setMensagem('❌ Erro ao cadastrar aluno: ' + error.message)
    } else {
      setMensagem('✅ Aluno cadastrado com sucesso!')
      setNovoAlunoNome('')
      setNovoAlunoMatricula('')
      carregarDados() // Recarrega a lista
    }
    setSalvando(false)
  }

  // Função para cadastrar nova turma no Supabase
  async function cadastrarTurma(e) {
    e.preventDefault()
    if (!novaTurmaNome) return

    setSalvando(true)
    const { error } = await supabase.from('turmas').insert([
      { disciplina: novaTurmaNome, codigo: novaTurmaCodigo }
    ])

    if (error) {
      setMensagem('❌ Erro ao cadastrar turma: ' + error.message)
    } else {
      setMensagem('✅ Turma cadastrada com sucesso!')
      setNovaTurmaNome('')
      setNovaTurmaCodigo('')
      carregarDados() // Recarrega a lista
    }
    setSalvando(false)
  }

  // Função para alternar o status de presença (Presente / Ausente)
  const togglePresenca = (alunoId) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: prev[alunoId] === 'AUSENTE' ? 'PRESENTE' : 'AUSENTE',
    }))
  }

  // Função para salvar chamada no banco
  async function salvarChamada() {
    if (!turmaSelecionada) return
    setSalvando(true)

    const dataHoje = new Date().toISOString().split('T')[0]
    
    const novosRegistros = alunos.map((aluno) => ({
      aluno_id: aluno.id,
      turma_id: Number(turmaSelecionada),
      data_aula: dataHoje,
      status: presencas[aluno.id] || 'PRESENTE',
    }))

    const { error } = await supabase.from('presenca').insert(novosRegistros)

    if (error) {
      setMensagem('❌ Erro ao salvar chamada: ' + error.message)
    } else {
      setMensagem('✅ Chamada salva com sucesso no banco!')
      setTimeout(() => setMensagem(''), 4000)
    }
    setSalvando(false)
  }

  if (loading) {
    return <div className="p-10 text-center text-xl font-semibold">Carregando dados...</div>
  }

  return (
    <main className="min-h-screen p-6 bg-gray-100 text-gray-800">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center">
          📋 Controle de Frequência Teste
        </h1>

        {/* Navegação por Abas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setAbaAtiva('chamada'); setMensagem('') }}
            className={`py-2 px-4 font-semibold text-sm border-b-2 ${
              abaAtiva === 'chamada'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Fazer Chamada
          </button>
          <button
            onClick={() => { setAbaAtiva('aluno'); setMensagem('') }}
            className={`py-2 px-4 font-semibold text-sm border-b-2 ${
              abaAtiva === 'aluno'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            + Adicionar Aluno
          </button>
          <button
            onClick={() => { setAbaAtiva('turma'); setMensagem('') }}
            className={`py-2 px-4 font-semibold text-sm border-b-2 ${
              abaAtiva === 'turma'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            + Adicionar Turma
          </button>
        </div>

        {/* MENSAGEM DE FEEDBACK */}
        {mensagem && (
          <div className="p-3 text-center rounded-lg text-sm font-medium bg-gray-100 border border-gray-300">
            {mensagem}
          </div>
        )}

        {/* ABA 1: FAZER CHAMADA */}
        {abaAtiva === 'chamada' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Selecione a Turma:</label>
              <select
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {turmas.length === 0 ? (
                  <option value="">Nenhuma turma cadastrada</option>
                ) : (
                  turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.disciplina || t.nome} {t.codigo ? `(${t.codigo})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">Lista de Alunos</h2>
              {alunos.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  Nenhum aluno cadastrado. Acesse a aba "+ Adicionar Aluno" para cadastrar.
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
                        <div>
                          <p className="font-semibold text-gray-900">{aluno.nome}</p>
                          {aluno.matricula && (
                            <p className="text-xs text-gray-500">Matrícula: {aluno.matricula}</p>
                          )}
                        </div>
                        <button
                          onClick={() => togglePresenca(aluno.id)}
                          className={`px-4 py-1.5 rounded-full font-bold text-xs transition-colors ${
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

            <button
              onClick={salvarChamada}
              disabled={alunos.length === 0 || salvando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Chamada no Banco'}
            </button>
          </div>
        )}

        {/* ABA 2: CADASTRAR ALUNO */}
        {abaAtiva === 'aluno' && (
          <form onSubmit={cadastrarAluno} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Cadastrar Novo Aluno</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Aluno:</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={novoAlunoNome}
                onChange={(e) => setNovoAlunoNome(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Matrícula:</label>
              <input
                type="text"
                placeholder="Ex: 202401"
                value={novoAlunoMatricula}
                onChange={(e) => setNovoAlunoMatricula(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {salvando ? 'Cadastrando...' : 'Cadastrar Aluno'}
            </button>
          </form>
        )}

        {/* ABA 3: CADASTRAR TURMA */}
        {abaAtiva === 'turma' && (
          <form onSubmit={cadastrarTurma} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Cadastrar Nova Turma</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Disciplina:</label>
              <input
                type="text"
                placeholder="Ex: Desenvolvimento de Software"
                value={novaTurmaNome}
                onChange={(e) => setNovaTurmaNome(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código da Turma (Opcional):</label>
              <input
                type="text"
                placeholder="Ex: DS101"
                value={novaTurmaCodigo}
                onChange={(e) => setNovaTurmaCodigo(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {salvando ? 'Cadastrando...' : 'Cadastrar Turma'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}