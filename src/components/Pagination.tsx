import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('page', page.toString());
    return url.pathname + url.search;
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <Link
          key={i}
          to={getPageUrl(i)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentPage === i
              ? 'bg-wine-600 text-white shadow-[0_0_15px_rgba(128,0,0,0.3)]'
              : 'bg-[#161616] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]'
          }`}
        >
          {i}
        </Link>
      );
    }
    return buttons;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-12 py-8 border-t border-[#2a2a2a]">
      {/* First Page */}
      {currentPage > 1 && (
        <Link
          to={getPageUrl(1)}
          className="p-2 rounded-lg bg-[#161616] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all"
          title="First Page"
        >
          <ChevronsLeft size={20} />
        </Link>
      )}

      {/* Previous Page */}
      {currentPage > 1 && (
        <Link
          to={getPageUrl(currentPage - 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161616] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all"
        >
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      )}

      <div className="flex items-center gap-2">
        {renderPageButtons()}
      </div>

      {/* Next Page */}
      {currentPage < totalPages && (
        <Link
          to={getPageUrl(currentPage + 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161616] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={20} />
        </Link>
      )}

      {/* Last Page */}
      {currentPage < totalPages && (
        <Link
          to={getPageUrl(totalPages)}
          className="p-2 rounded-lg bg-[#161616] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a] transition-all"
          title="Last Page"
        >
          <ChevronsRight size={20} />
        </Link>
      )}
    </div>
  );
}
