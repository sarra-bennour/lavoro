const ResponsiveSearchModal = () => {
  return (
    <div
      className="modal fade"
      id="header-responsive-search"
      tabIndex={-1}
      aria-labelledby="header-responsive-search"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-body">
            <div className="input-group">
              <input
                type="text"
                className="form-control border-end-0"
                placeholder="Search Anything ..."
                aria-label="Search Anything ..."
                aria-describedby="button-addon2"
              />
              <button className="btn btn-primary" type="button" id="button-addon2">
                <i className="ri-search-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveSearchModal

