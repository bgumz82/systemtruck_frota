import { Fragment } from 'react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { clearAppCache } from '@/lib/cache'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <Disclosure as="nav" className="bg-indigo-600">
      {() => (
        <>
          <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <span className="text-white text-xl font-bold">Sistema de Frota</span>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  className="rounded-full bg-indigo-700 p-1 text-white hover:bg-indigo-800 focus:outline-none"
                >
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                <Menu as="div" className="relative ml-3">
                  <Menu.Button className="flex rounded-full bg-indigo-700 text-sm focus:outline-none">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
                      <span className="text-sm font-medium leading-none text-white">
                        {user?.email?.[0].toUpperCase()}
                      </span>
                    </span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={async () => {
                              const cleared = await clearAppCache()
                              if (cleared) {
                                toast.success('Cache limpo com sucesso!')
                                window.location.reload()
                              } else {
                                toast.error('Erro ao limpar cache')
                              }
                            }}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block w-full px-4 py-2 text-sm text-gray-700 text-left`}
                          >
                            Limpar Cache
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } block w-full px-4 py-2 text-sm text-gray-700 text-left`}
                          >
                            Sair
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  )
}