'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/index';
import { X, Filter, ChevronDown, ChevronUp, Palette, Shirt, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

interface ProductFiltersProps {
  products: Product[];
  onFilterChange: (filters: FilterState) => void;
  className?: string;
  hideCategories?: boolean;
}

export interface FilterState {
  brands: string[];
  colors: string[];
  sizes: string[];
  seasons: string[];
  priceRange: [number, number];
  onSale: boolean;
  featured: boolean;
}

const FilterSection = ({
  title,
  sectionKey,
  children,
  count,
  expanded,
  onToggle,
  icon
}: {
  title: string;
  sectionKey: string;
  children: React.ReactNode;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) => (
  <div className="border-b border-gray-200 pb-4 mb-4">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-left py-2 hover:text-blue-600 transition-colors"
    >
      <span className="font-medium text-gray-900 flex items-center gap-2">
        {icon}
        {title}
        {count !== undefined && count > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {count}
          </span>
        )}
      </span>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
    {expanded && (
      <div className="mt-3">
        {children}
      </div>
    )}
  </div>
);

const CheckboxList = ({
  options,
  selectedValues,
  onChange,
  maxVisible = 5
}: {
  options: string[];
  selectedValues: string[];
  onChange: (value: string, checked: boolean) => void;
  maxVisible?: number;
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleOptions = showAll ? options : options.slice(0, maxVisible);

  return (
    <div className="space-y-2">
      {visibleOptions.map(option => (
        <label key={option} className="flex items-center space-x-2 cursor-pointer group">
          <Checkbox
            checked={selectedValues.includes(option)}
            onCheckedChange={(checked) => onChange(option, checked as boolean)}
            className="group-hover:border-blue-500"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 capitalize">
            {option}
          </span>
        </label>
      ))}
      {options.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
        >
          {showAll ? 'Ver menos' : `Ver ${options.length - maxVisible} más`}
        </button>
      )}
    </div>
  );
};

export default function ProductFilters({ 
  products, 
  onFilterChange, 
  className = '',
  hideCategories = false 
}: Readonly<ProductFiltersProps>) {
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    colors: [],
    sizes: [],
    seasons: [],
    priceRange: [0, 1000000],
    onSale: false,
    featured: false
  });

  const [expandedSections, setExpandedSections] = useState({
    brands: true,
    colors: true,
    sizes: true,
    seasons: false,
    price: true,
    special: true
  });

  const availableOptions = {
    brands: Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[],
    colors: Array.from(new Set(
      products.flatMap(p =>
        p.product_variants?.map(v => v.color) || []
      ).filter(Boolean)
    )).sort((a, b) => a.localeCompare(b)),
    sizes: Array.from(new Set(
      products.flatMap(p =>
        p.product_variants?.map(v => v.size) || []
      ).filter(Boolean)
    )).sort((a, b) => {
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

      return a.localeCompare(b);
    }),
    seasons: Array.from(new Set(products.map(p => p.season).filter(Boolean))) as string[]
  };

  // Ordenar arrays después del filtrado
  availableOptions.brands.sort((a, b) => a.localeCompare(b));
  availableOptions.seasons.sort((a, b) => a.localeCompare(b));

  const priceRange = products.length > 0 ? {
    min: Math.floor(Math.min(...products.map(p => p.price))),
    max: Math.ceil(Math.max(...products.map(p => p.price)))
  } : { min: 0, max: 1000000 };

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [priceRange.min, priceRange.max]
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRange.min, priceRange.max]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleArrayFilterChange = (
    category: keyof Pick<FilterState, 'brands' | 'colors' | 'sizes' | 'seasons'>,
    value: string,
    checked: boolean
  ) => {
    setFilters(prev => ({
      ...prev,
      [category]:
        checked
          ? [...prev[category], value]
          : prev[category].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      brands: [],
      colors: [],
      sizes: [],
      seasons: [],
      priceRange: [priceRange.min, priceRange.max],
      onSale: false,
      featured: false
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4 mr-1" />
          Limpiar todo
        </Button>
      </div>

      {availableOptions.brands.length > 0 && (
        <FilterSection
          title="Marcas"
          sectionKey="brands"
          count={filters.brands.length}
          expanded={expandedSections.brands}
          onToggle={() => toggleSection('brands')}
          icon={<Tag className="w-4 h-4" />}
        >
          <CheckboxList
            options={availableOptions.brands}
            selectedValues={filters.brands}
            onChange={(value, checked) => handleArrayFilterChange('brands', value, checked)}
          />
        </FilterSection>
      )}

      {availableOptions.colors.length > 0 && (
        <FilterSection
          title="Colores"
          sectionKey="colors"
          count={filters.colors.length}
          expanded={expandedSections.colors}
          onToggle={() => toggleSection('colors')}
          icon={<Palette className="w-4 h-4" />}
        >
          <CheckboxList
            options={availableOptions.colors}
            selectedValues={filters.colors}
            onChange={(value, checked) => handleArrayFilterChange('colors', value, checked)}
          />
        </FilterSection>
      )}

      {availableOptions.sizes.length > 0 && (
        <FilterSection
          title="Tallas"
          sectionKey="sizes"
          count={filters.sizes.length}
          expanded={expandedSections.sizes}
          onToggle={() => toggleSection('sizes')}
          icon={<Shirt className="w-4 h-4" />}
        >
          <CheckboxList
            options={availableOptions.sizes}
            selectedValues={filters.sizes}
            onChange={(value, checked) => handleArrayFilterChange('sizes', value, checked)}
            maxVisible={8}
          />
        </FilterSection>
      )}

      <FilterSection
        title="Precio"
        sectionKey="price"
        expanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-4">
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) =>
                setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
              }
              max={priceRange.max}
              min={priceRange.min}
              step={1000}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>${filters.priceRange[0].toLocaleString()}</span>
            <span>${filters.priceRange[1].toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Mín"
              value={filters.priceRange[0]}
              onChange={(e) => {
                const value = Number(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  priceRange: [value, prev.priceRange[1]] as [number, number]
                }));
              }}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="Máx"
              value={filters.priceRange[1]}
              onChange={(e) => {
                const value = Number(e.target.value);
                setFilters(prev => ({
                  ...prev,
                  priceRange: [prev.priceRange[0], value] as [number, number]
                }));
              }}
              className="text-sm"
            />
          </div>
        </div>
      </FilterSection>

      {availableOptions.seasons.length > 0 && (
        <FilterSection
          title="Temporada"
          sectionKey="seasons"
          count={filters.seasons.length}
          expanded={expandedSections.seasons}
          onToggle={() => toggleSection('seasons')}
          icon={<Calendar className="w-4 h-4" />}
        >
          <CheckboxList
            options={availableOptions.seasons}
            selectedValues={filters.seasons}
            onChange={(value, checked) => handleArrayFilterChange('seasons', value, checked)}
            maxVisible={4}
          />
        </FilterSection>
      )}

      <FilterSection
        title="Especiales"
        sectionKey="special"
        expanded={expandedSections.special}
        onToggle={() => toggleSection('special')}
      >
        <div className="space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <Checkbox
              checked={filters.onSale}
              onCheckedChange={(checked) =>
                setFilters(prev => ({ ...prev, onSale: checked as boolean }))
              }
              className="group-hover:border-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              🔥 En oferta
            </span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer group">
            <Checkbox
              checked={filters.featured}
              onCheckedChange={(checked) =>
                setFilters(prev => ({ ...prev, featured: checked as boolean }))
              }
              className="group-hover:border-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              ⭐ Destacados
            </span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}
