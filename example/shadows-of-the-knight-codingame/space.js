const Space = function(dim_x, dim_y, solution_x, solution_y, current_x, current_y) {
    this.dim_x = dim_x;
    this.dim_y = dim_y;
    this.solution_x = solution_x;
    this.solution_y = solution_y;
    this.current_x = current_x;
    this.current_y = current_y;
    this.hint = "";
    this.update_hint();
};
Space.prototype.update_hint = function() {
    this.hint = "";
    
    if (this.solution_y < this.current_y) this.hint += "U";
    else if (this.solution_y > this.current_y) this.hint += "D";
    
    if (this.solution_x < this.current_x) this.hint += "L";
    else if (this.solution_x > this.current_x) this.hint += "R";
};
Space.prototype.move = function(x, y) {
    this.current_x = x;
    this.current_y = y;
    this.update_hint();
};
Space.prototype.solved = function() {
    return this.current_x === this.solution_x
        && this.current_y === this.solution_y;
};
const SpaceBuilder = function() {
    this.dim_x = 0;
    this.dim_y = 0;
    this.solution_x = 0;
    this.solution_y = 0;
    this.current_x = 0;
    this.current_y = 0;
};
SpaceBuilder.prototype.withDimension = function(x, y) {
    this.dim_x = x;
    this.dim_y = y;
    return this;
};
SpaceBuilder.prototype.withSolution = function(x, y) {
    this.solution_x = x;
    this.solution_y = y;
    return this;
};
SpaceBuilder.prototype.withCurrent = function(x, y) {
    this.current_x = x;
    this.current_y = y;
    return this;
};
SpaceBuilder.prototype.build = function() {
    return new Space(this.dim_x, this.dim_y, this.solution_x, this.solution_y, this.current_x, this.current_y);
};

module.exports = { Space, SpaceBuilder };
