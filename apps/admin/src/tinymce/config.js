export const getTinyMceConfig = ({ dark = false, height = 300 } = {}) => {
  return {
    license_key: 'gpl',
    base_url: '/tinymce',
    suffix: '.min',
    height,
    menubar: false,
    plugins: [
      'autolink',
      'autosave',
      'charmap',
      'code',
      'fullscreen',
      'help',
      'image',
      'link',
      'lists',
      'preview',
      'quickbars',
      'searchreplace',
      'table',
      'visualblocks',
      'wordcount'
    ],
    toolbar:
      'styles | bold italic underline strikethrough forecolor backcolor | link image | alignleft aligncenter alignright | numlist bullist outdent indent | code removeformat',
    contextmenu: 'link image table',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
    branding: false,
    promotion: false,
    skin: dark ? 'oxide-dark' : 'oxide',
    content_css: dark ? 'dark' : 'default',
    entity_encoding: 'raw',
    element_format: 'html',
    relative_urls: false,
    document_base_url:
      typeof window !== 'undefined' && window.location ? window.location.origin : '',
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
    quickbars_insert_toolbar: false
  }
}
