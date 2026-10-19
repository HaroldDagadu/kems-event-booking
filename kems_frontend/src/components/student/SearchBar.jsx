import React, { useState } from 'react'
import { Search } from 'lucide-react'

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  return (
    <div className="px-4 py-3">
      <label className="flex flex-col min-w-40 h-12 w-full">
        <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
          <div className="text-[#51946b] flex border-none bg-[#e8f2ec] items-center justify-center pl-4 rounded-l-lg border-r-0">
            <Search size={24} />
          </div>
          <input
            type="text"
            placeholder="Search events"
            value={searchQuery}
            onChange={handleSearchChange}
            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0e1a13] focus:outline-0 focus:ring-0 border-none bg-[#e8f2ec] focus:border-none h-full placeholder:text-[#51946b] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
          />
        </div>
      </label>
    </div>
  )
}

export default SearchBar