import { render, screen } from '@testing-library/react'
import HeroPrincipal from '@/components/home/HeroPrincipal'

describe('HeroPrincipal Component', () => {
  it('renderiza el título principal', () => {
    render(<HeroPrincipal />)

    const texto = screen.getByText(/Descubre Tu/i)
    expect(texto).toBeInTheDocument()
  })
})
