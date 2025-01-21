/**
 * Copyright 2025 Tim Kellogg
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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