/**
 * Copyright (c) 2024. Licensed under the MIT License.
 * See LICENSE file for license information.
 */

import { useJobPostingStore } from '../stores/useJobPostingStore'

export function JobPostings() {
  const { postings } = useJobPostingStore()

  return (
    <div>
      <h2>Job Postings</h2>
      <ul>
        {postings.map(posting => (
          <li key={posting.id}>
            <h3>{posting.title}</h3>
            <p>{posting.company}</p>
            <a href={posting.url} target="_blank" rel="noopener noreferrer">View Job</a>
          </li>
        ))}
      </ul>
    </div>
  )
} 