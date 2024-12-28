interface JobListing {
  title: string;
  company: string;
  location: string;
  details: string[];
  link: string;
}

export function formatJobAlertEmail(content: string): string {
  // Split content into sections by separator
  const sections = content.split('---------------------------------------------------------');
  
  // Extract job listings
  const jobListings: JobListing[] = [];
  
  sections.forEach((section) => {
    const lines = section.trim().split('\r\n').filter(line => line.trim());
    
    if (lines.length >= 3 && !lines[0].includes('See all jobs')) {
      const jobListing: JobListing = {
        title: lines[0].trim(),
        company: lines[1].trim(),
        location: lines[2].trim(),
        details: lines.slice(3, -1), // Everything between location and link
        link: lines[lines.length - 1].replace('View job: ', '').trim()
      };
      
      if (jobListing.title && jobListing.company) {
        jobListings.push(jobListing);
      }
    }
  });

  // Convert to HTML
  const htmlContent = `
    <div class="email-content job-alert">
      <div class="email-header">
        <h2 class="text-xl font-semibold mb-4">Job Alert: Web Developer Positions</h2>
        <p class="text-gray-600 mb-6">${jobListings.length} new jobs match your preferences</p>
      </div>
      
      <div class="job-listings space-y-4">
        ${jobListings.map(job => `
          <div class="email-card job-listing">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-blue-600">${job.title}</h3>
                <p class="text-base font-medium text-gray-900">${job.company}</p>
                <p class="text-sm text-gray-600">${job.location}</p>
                
                ${job.details.length > 0 ? `
                  <ul class="mt-2 space-y-1">
                    ${job.details.map(detail => `
                      <li class="text-sm text-gray-600">${detail}</li>
                    `).join('')}
                  </ul>
                ` : ''}
              </div>
              
              <a href="${job.link}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                View Job
              </a>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="mt-6 text-center">
        <a href="${content.match(/See all jobs on LinkedIn:\s*(https:\/\/[^\s]+)/)?.[1] || '#'}" 
           target="_blank" 
           rel="noopener noreferrer"
           class="text-blue-600 hover:text-blue-800 font-medium">
          See all jobs on LinkedIn
        </a>
      </div>
    </div>
  `;

  return htmlContent;
}

export function isJobAlertEmail(subject: string, from: string): boolean {
  return from.toLowerCase().includes('jobalerts-noreply@linkedin.com') && 
         subject.toLowerCase().includes('developer');
}
