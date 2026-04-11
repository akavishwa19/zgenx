import ejs from 'ejs';

function renderTemplate(
  template: string,
  options?: Record<string, unknown>
): string {
  return ejs.render(template, options);
}

export default renderTemplate;
