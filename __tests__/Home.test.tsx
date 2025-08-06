import { render, screen } from '@testing-library/react'
import HeroPrincipal from '@/components/home/HeroPrincipal'

// Mock del contexto de personalización
jest.mock('@/context/PersonalizationContext', () => ({
  usePersonalizationContext: () => ({
    banners: [],
    loading: false,
    theme: null,
    branding: null,
    footer: null,
    footerLinks: [],
    socialMedia: [],
    error: null,
    refreshData: jest.fn(),
  }),
}))

// Mock de Next.js Link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
  MockedLink.displayName = 'MockedLink'
  return MockedLink
})

describe('HeroPrincipal Component', () => {
  it('renderiza el título principal', () => {
    render(<HeroPrincipal />)

    const texto = screen.getByText(/Descubre Tu/i)
    expect(texto).toBeInTheDocument()
  })

  it('renderiza el subtítulo por defecto', () => {
    render(<HeroPrincipal />)

    const subtitulo = screen.getByText(/Estilo Perfecto/i)
    expect(subtitulo).toBeInTheDocument()
  })

  it('renderiza los botones de acción', () => {
    render(<HeroPrincipal />)

    const botonMujeres = screen.getByText(/Comprar Mujeres/i)
    const botonHombres = screen.getByText(/Comprar Hombres/i)
    
    expect(botonMujeres).toBeInTheDocument()
    expect(botonHombres).toBeInTheDocument()
  })

  it('renderiza la descripción por defecto', () => {
    render(<HeroPrincipal />)

    const descripcion = screen.getByText(/Moda premium que habla de tu individualidad/i)
    expect(descripcion).toBeInTheDocument()
  })
})
