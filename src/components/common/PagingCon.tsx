import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props{
    currentPage: number ;
    handlePageChange : (newPage: any) => void;
    totalPages : number; 
    endPage : number;
    startPage : number;
    first : boolean;
    last : boolean;

}

function PagingCon({currentPage, totalPages, handlePageChange, first, last, startPage, endPage} : Props ) {
  return (
    totalPages > 1 && (
                <nav className="flex justify-center items-center gap-2 pt-10">
                    <button 
                        disabled={first}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="p-2 rounded-lg border border-slate-200 hover:!bg-slate-50 disabled:!opacity-30 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(pageIndex => (
                            <button 
                                key={pageIndex}
                                onClick={() => handlePageChange(pageIndex)}
                                className={`w-10 h-10 rounded-lg !text-sm !font-semibold !transition-all !border-slate-200 ${
                                    pageIndex === currentPage 
                                    ? '!bg-slate-900 !text-white !shadow-lg !shadow-slate-200 !scale-110 ' 
                                    : '!text-slate-600 hover:!bg-slate-100'
                                }`}
                            >
                                {pageIndex + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        disabled={last}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="p-2 rounded-lg border !border-slate-200 hover:!bg-slate-50 disabled:!opacity-30 transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </nav>
            )
  );
}
export {PagingCon};