import React from "react";

export default function AddedMaterials() {
  return (
    <div className="px-2">
      <div className="bg-white rounded-lg p-5 w-[96%] mt-5 px-8">
        <h3 className="font-open-sans font-semibold mb-10">
          Recently Added Materials
        </h3>
        <table className="table-auto w-full border-collapse">
          <thead className="text-left">
            <tr className="tracking-wider !text-left uppercase text-gray-400 text-xs font-karla border-b border-gray-200">
              <th className="!text-left py-3">Title</th>
              <th className="!text-left">Course</th>
              <th className="!text-left">Type</th>
              <th className="!text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-poppins text-xs py-3 text-gray-800 font-normal border-b border-gray-200">
              <td className="px-6 py-4">Telecommunications Principle I</td>
              <td>EEE473</td>
              <td>Textbook</td>
              <td className="!text-gray-500">21 Mar 2025 11:45AM</td>
            </tr>
            <tr className="font-poppins text-xs py-3 text-gray-800 font-normal border-b border-gray-200">
              <td className="px-6 py-4">
                Energy Generation, Distribution, Utilization
              </td>
              <td>EEE433</td>
              <td>Material</td>
              <td className="!text-gray-500">05 Apr 2025 09:45AM</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
