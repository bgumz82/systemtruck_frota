import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { QRCodeSVG } from 'qrcode.react'
import { getFuncionarios, createFuncionario, updateFuncionario, deleteFuncionario } from '@/lib/api/funcionarios'
import type { Funcionario, CreateFuncionarioParams, UpdateFuncionarioParams } from '@/lib/api/funcionarios'
import fundocracha from '@/pages/images/fundo_cracha.jpg'

// Dimensões originais do crachá
const CRACHA_ORIGINAL_WIDTH = 638
const CRACHA_ORIGINAL_HEIGHT = 1016

// Dimensões desejadas para exibição
const CRACHA_DISPLAY_WIDTH = 383 // Metade do tamanho original

export default function Funcionarios() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCrachaModalOpen, setIsCrachaModalOpen] = useState(false)
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: funcionarios, isLoading, error, refetch } = useQuery({
    queryKey: ['funcionarios'],
    queryFn: getFuncionarios,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5 // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: (params: CreateFuncionarioParams) => createFuncionario(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário cadastrado com sucesso!')
      setIsModalOpen(false)
      setPreviewImage(null)
    },
    onError: (error: any) => {
      console.error('Error creating funcionario:', error)
      toast.error('Erro ao cadastrar funcionário')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (params: UpdateFuncionarioParams) => updateFuncionario(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário atualizado com sucesso!')
      setIsModalOpen(false)
      setPreviewImage(null)
    },
    onError: (error: any) => {
      console.error('Error updating funcionario:', error)
      toast.error('Erro ao atualizar funcionário')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFuncionario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] })
      toast.success('Funcionário excluído com sucesso!')
    },
    onError: (error: any) => {
      console.error('Error deleting funcionario:', error)
      toast.error('Erro ao excluir funcionário')
    }
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const funcionarioData = {
      nome: formData.get('nome') as string,
      cpf: formData.get('cpf') as string,
      rg: formData.get('rg') as string,
      matricula: formData.get('matricula') as string,
      data_admissao: formData.get('data_admissao') as string,
      data_nascimento: formData.get('data_nascimento') as string,
      telefone: formData.get('telefone') as string || null,
      funcao: formData.get('funcao') as string,
    }

    const fotoInput = formData.get('foto') as File
    if (!fotoInput && !selectedFuncionario) {
      toast.error('A foto é obrigatória')
      return
    }

    if (selectedFuncionario) {
      updateMutation.mutate({ 
        id: selectedFuncionario.id, 
        funcionario: funcionarioData,
        foto: fotoInput instanceof File ? fotoInput : undefined
      })
    } else {
      if (!(fotoInput instanceof File)) {
        toast.error('A foto é obrigatória')
        return
      }
      createMutation.mutate({ funcionario: funcionarioData, foto: fotoInput })
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario)
    setPreviewImage(funcionario.foto_url || null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleShowCracha = (funcionario: Funcionario) => {
    setSelectedFuncionario(funcionario)
    setIsCrachaModalOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Erro ao carregar funcionários
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ocorreu um erro ao carregar os dados. Por favor, tente novamente.
          </p>
          <div className="mt-6">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calcular escala para o crachá
  const scale = CRACHA_DISPLAY_WIDTH / CRACHA_ORIGINAL_WIDTH
  const displayHeight = CRACHA_ORIGINAL_HEIGHT * scale

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Funcionários</h1>
          <button
            onClick={() => {
              setSelectedFuncionario(null)
              setPreviewImage(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Novo Funcionário
          </button>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Foto
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Nome
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Matrícula
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Função
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Admissão
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {funcionarios?.map((funcionario) => (
                      <tr key={funcionario.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {funcionario.foto_url && (
                            <img
                              src={funcionario.foto_url}
                              alt={funcionario.nome}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {funcionario.nome}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {funcionario.matricula}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {funcionario.funcao}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Date(funcionario.data_admissao).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            funcionario.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {funcionario.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleShowCracha(funcionario)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Gerar Crachá"
                          >
                            <IdentificationIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(funcionario)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(funcionario.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium mb-4">
              {selectedFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-6">
                    <div className="shrink-0">
                      <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 p-2">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="h-full w-full rounded object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <span className="text-gray-400">Sem foto</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Foto
                      </label>
                      <input
                        type="file"
                        name="foto"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    defaultValue={selectedFuncionario?.nome}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    defaultValue={selectedFuncionario?.cpf}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    RG
                  </label>
                  <input
                    type="text"
                    name="rg"
                    defaultValue={selectedFuncionario?.rg}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Matrícula RH
                  </label>
                  <input
                    type="text"
                    name="matricula"
                    defaultValue={selectedFuncionario?.matricula}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Admissão
                  </label>
                  <input
                    type="date"
                    name="data_admissao"
                    defaultValue={selectedFuncionario?.data_admissao}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    name="data_nascimento"
                    defaultValue={selectedFuncionario?.data_nascimento}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    defaultValue={selectedFuncionario?.telefone || ''}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Função
                  </label>
                  <input
                    type="text"
                    name="funcao"
                    defaultValue={selectedFuncionario?.funcao}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  {selectedFuncionario ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do Crachá */}
      {isCrachaModalOpen && selectedFuncionario && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Crachá - {selectedFuncionario.nome}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => setIsCrachaModalOpen(false)}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
            
            {/* Container do Crachá */}
            <div className="flex justify-center overflow-hidden modal-cracha">
              {/* Crachá */}
              <div 
                className="relative bg-white"
                style={{
                  width: `${CRACHA_ORIGINAL_WIDTH}px`,
                  height: `${CRACHA_ORIGINAL_HEIGHT}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  marginBottom: `-${CRACHA_ORIGINAL_HEIGHT - displayHeight}px`
                }}
              >
                {/* Imagem de fundo */}
                <img 
                  src={fundocracha}
                  alt="Background"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Foto do funcionário */}
                {selectedFuncionario.foto_url && (
                  <div 
                    className="absolute"
                    style={{
                      top: '251px',
                      left: '194px',
                      width: '250px',
                      height: '319px'
                    }}
                  >
                    <img
                      src={selectedFuncionario.foto_url}
                      alt={selectedFuncionario.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Nome e Função */}
                <div 
                  className="absolute text-center font-signika"
                  style={{
                    top: '880px',
                    left: '26px',
                    right: '27px',
                    bottom: '50px'
                  }}
                >
                  <p 
                    className="text-white font-bold leading-tight"
                    style={{ fontSize: '28px' }}
                  >
                    {selectedFuncionario.nome}
                  </p>
                  <p 
                    className="text-white mt-[19px]"
                    style={{ fontSize: '28px' }}
                  >
                    {selectedFuncionario.funcao}
                  </p>
                </div>

                {/* QR Code */}
                <div 
                  className="absolute flex items-center justify-center"
                  style={{
                    top: '580px',
                    left: '17px',
                    width: '286px',
                    height: '286px'
                  }}
                >
                  <QRCodeSVG
                    value={selectedFuncionario.matricula}
                    size={220}
                    level="H"
                    bgColor="#045800"
                    fgColor="#267c23"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}