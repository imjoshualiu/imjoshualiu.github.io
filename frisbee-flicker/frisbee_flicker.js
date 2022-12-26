import { defs, tiny } from './examples/common.js';
import { Body } from './collision.js';


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

let first_level = true;

//colors
var yellow = hex_color("#fac91a");
var red = hex_color("#FF0000");
var green = hex_color("#00FF00");
var forest_green = hex_color("#00cc00")
var black = hex_color("#000000")
var white = hex_color("#FFFFFF")

export class frisbee_flicker extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            cylinder: new defs.Capped_Cylinder(4, 12, [[0, 2], [0, 1]]),
            frisbee: new defs.Capped_Cylinder(4, 12, [[0, 2], [0, 1]]),
            target: new defs.Capped_Cylinder(4, 12, [[0, 2], [0, 1]]),
            sphere: new defs.Subdivision_Sphere(4),
            ground: new defs.Square(),
            sky: new defs.Subdivision_Sphere(4),
            leaves: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            trunk: new defs.Square(),
            cloud: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            grass: new defs.Shape_From_File( "assets/grass_7.obj"),
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            ground: new Material(new defs.Phong_Shader(), {color: hex_color("#23cc5e"), ambient: 0.8}),
            frisbee: new Material(new defs.Phong_Shader(), {color: yellow, ambient: 1, diffusivity: 0.8, specularity: 0.2, texture: new Texture("assets/frisbee_ucla.png")}),
            sky: new Material(new defs.Phong_Shader(), {ambient: 1, color: hex_color("#1da4de")}),
            shadow: new Material(new defs.Phong_Shader(), {color: color(0,0,0,0.75), specularity : 0.0, diffusivity: 0.0}),
            trunk: new Material(new defs.Phong_Shader(),
            {ambient: 0.9, diffusivity: 0.8, specularity : 0.35, color: hex_color("#964B00")}),
            leaves: new Material(new defs.Phong_Shader(), {ambient: 0.9, diffusivity: 0.8, specularity : 0.35, color: hex_color("#3A5F0B")}),
            cloud: new Material(new defs.Phong_Shader(), {color: hex_color("#ffffff"), diffusivity: 0.78, ambient: 0.92}),
            grass: new Material(new defs.Phong_Shader(), {color: hex_color("#18ba51"), ambient: .7, diffusivity: .5, specularity: .5 } ),
            grass_1: new Material(new defs.Phong_Shader(), {color: hex_color("#59c756"), ambient: .7, diffusivity: .5, specularity: .5 } ),
            grass_2: new Material(new defs.Phong_Shader(), {color: hex_color("#02a83c"), ambient: .7, diffusivity: .5, specularity: .5 } ),
            target_textured: new Material(new defs.Textured_Phong(), {ambient: 1, texture: new Texture("assets/target.png")}),
            frisbee_textured: new Material(new defs.Textured_Phong(), {color: hex_color("#000000"), ambient: 1, texture: new Texture("assets/frisbee_texture3.jpg")}),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 14.7, 20), vec3(0, 14.7, 0), vec3(0, 1, 0));
        this.wide_camera_location = Mat4.look_at(vec3(200, 15, -350), vec3(-90, 0, 0), vec3(0, 1, 0));
        this.frisbee_camera_location = this.initial_camera_location;
        this.angle_left = false
        this.angle_right = false
        this.frisbee_angle = 0;
        this.frisbee_angle_display = 0;

        //camera angles
        this.camera_angle = 1;

        //control mechanics
        this.reset = false;
        this.increase_velocity = false;
        this.decrease_velocity = false;

        //frisbee_throwing mechanics
        this.distance = 0;
        this.throw = false;
        this.thrown = false;
        this.throw_time = 0;
        this.throwing_height = 13;
        this.throwing_angle = 12;
        this.velocity = 14;
        this.horizontal_velocity = 0;
        this.vertical_velocity = 0;
        this.frisbee_height = 13;
        this.elapsed_time_prev = 0;
        this.curve = 0;
        this.negative_frisbee_angle = false;
        this.spin = true;
        

        //frisbee trail mechanics
        this.frisbee_trail_transforms = [];
        this.show_trail = false;

        //target mechanics
        this.target_color = [];

        //collision mechanics
        this.collider = { intersect_test: Body.intersect_sphere, points: new defs.Subdivision_Sphere(1), leeway: .5 }
        this.bodies = []
        const phong = new defs.Phong_Shader(1);
        this.bright = new Material(phong, { color: color(0, 1, 0, .5), ambient: 1 });
        this.collided = false;
        this.is_tree = Array(1).fill(false)
        this.not_hit_tree = true;

        //level mechanics
        this.current_level = 1
        this.stage_targets = []
        this.start_stage = true;
        this.completed_time = 0;
        this.attempt_count = 0;
        this.first_level = true;
        // this.wind = Math.floor(Math.random() * (10 + 10) - 10)/50
        this.wind = 0.001
        this.wind_total = 0;
        this.wind_direction = 0;
        this.cloud_angle = 0;
        this.current_cloud_angle = 0;
        this.cloud_rotation_angle = 0;
        this.target_direction_left = true;
        this.target_distance = 0;
        

        //sound effects
        this.crowdAudio = new Audio("./assets/crowd.mp3");
        this.crowdAudio.autoplay = false;
        this.failAudio = new Audio("./assets/fail.mp3");
        this.failAudio.autoplay = false;
        this.birdsAudio = new Audio("./assets/birds.mp3");
        this.birdsAudio.autoplay = true;
        this.hitAudio = new Audio("./assets/hit.mp3");
        this.hitAudio.autoplay = false;
        this.hittime = 0;


    }

    make_control_panel() {
        this.control_panel.innerHTML += "Current Frisbee Bearings:<br>";
        this.live_string(box => box.textContent = "- Velocity: " + this.velocity + " m/s");
        this.new_line();
        this.live_string(box => box.textContent = "- Angle: " + Math.floor(this.frisbee_angle_display) + " degrees");
        this.new_line();
        this.new_line();
        this.key_triggered_button("Angle Left", ["c"], () => this.angle_left = true);
        this.key_triggered_button("Angle Right", ["b"], () => this.angle_right = true);
        this.key_triggered_button("Throw", ["Enter"], () => this.throw = true);
        this.key_triggered_button("Reset", ["t"], () => this.reset = true);
        this.new_line();
        this.key_triggered_button("Show Trail", ["]"], () => this.show_trail = !this.show_trail);
        this.new_line()
        this.key_triggered_button("Increase Velocity", ["="], () => this.increase_velocity = true);
        this.key_triggered_button("Decrease Velocity", ["-"], () => this.decrease_velocity = true);
        this.key_triggered_button("Default Camera Angle", ["1"], () => this.camera_angle = 1);
        this.key_triggered_button("Frisbee Camera Angle", ["2"], () => this.camera_angle = 2);
        //camera views
        this.key_triggered_button("Default View", ["Control", "0"], () => this.attached = () => this.initial_camera_location);
        this.key_triggered_button("Side View", ["Control", "1"], () => this.attached = () => this.side);
        this.new_line();
        this.new_line();
        this.live_string(box => box.textContent = "- Current Level: " + this.current_level);
        this.new_line();
        this.live_string(box => box.textContent = "- Number of Attempts: " + this.attempt_count);
        this.new_line();
    
    }

    change_first_level(){
        this.first_level = false;
    }

    increase_vel() {
        if (this.increase_velocity && this.velocity < 24) {
            this.velocity += 1;
            this.increase_velocity = false;
        }
    }

    decrease_vel(){
        if(this.decrease_velocity && this.velocity > 11){
            this.velocity -= 1;
            this.decrease_velocity = false;
        }
    }


    throwing_angle_rad(){
        return this.throwing_angle/180*Math.PI
    }

    calculate_drag(velocity, air_density, area, drag_coefficient){
        //Use the Prandtl Relationship to calculate the drag force (horizontal) on the frisbee

        let drag_force = 0.5*(air_density) * (velocity**2) * area * drag_coefficient

        return drag_force
    }

    calculate_lift(velocity, air_density, area, angle_of_attack){
        //lift coefficient calculation
        let lift_coefficient_intercept = 0.15
        let lift_coefficient_attack = 1.4
        let lift_coefficient = lift_coefficient_intercept + angle_of_attack * lift_coefficient_attack

        //Use the Bernoulli Equation to calculate the lift force (vertical) generated by the frisbee

        let lift_force = 0.5 * (air_density) * (velocity ** 2) * area * lift_coefficient

        //account for angled throw
        if (Math.abs(this.frisbee_angle) > 0) {
            lift_force = lift_force * (1 + 1.1 * Math.sin(Math.abs(this.frisbee_angle) * Math.PI / 180))
        }
        return lift_force
    }

    calculate_distance(angle, time) {
        let mass = 0.175
        let gravity = 9.8
        let density_of_air_at_sea_level = 1.23
        let standard_frisbee_area = 0.0531

        //drag calculations
        let angle_of_attack = angle
        let angle_of_least_incidence = -0.0698132

        //drag coefficient calculation
        let form_drag = 0.08
        let induced_drag = 2.72
        let drag_coefficient = form_drag + induced_drag * (angle_of_attack - angle_of_least_incidence) ** 2

        //calculate lift force
        let lift_force = this.calculate_lift(this.horizontal_velocity, density_of_air_at_sea_level, standard_frisbee_area, angle)
        let gravitational_force = mass * gravity

        let vertical_force = lift_force - gravitational_force
        let vertical_acceleration = vertical_force / mass

        //account for frisbee terminal velocity
        let terminal_velocity = -Math.sqrt((2 * gravitational_force) / (density_of_air_at_sea_level * drag_coefficient * standard_frisbee_area))

        if (this.vertical_velocity + 0.5 * (vertical_acceleration * time) <= terminal_velocity) {
            this.vertical_velocity = terminal_velocity
        }
        else {
            this.vertical_velocity = this.vertical_velocity + 0.5 * (vertical_acceleration * time)
        }

        let drag_force = this.calculate_drag(this.horizontal_velocity, density_of_air_at_sea_level, standard_frisbee_area, drag_coefficient)
        let horizontal_acceleration = -drag_force / mass

        this.horizontal_velocity = this.horizontal_velocity + 0.5 * (horizontal_acceleration * time)
    }

    calculate_arc(time) {
        let process_angle = Math.abs(this.frisbee_angle)
        if (Math.abs(this.frisbee_angle) > 45) {
            process_angle = 90 - Math.abs(this.frisbee_angle);
        }

        let curve_angle = (process_angle) / 180 * Math.PI
        curve_angle = Math.round((curve_angle + Number.EPSILON) * 1000) / 1000

        // console.log("curve angle:" , curve_angle)
        // console.log("frisbee angle:" , this.frisbee_angle)

        let arc_calculation = (Math.sin(curve_angle)) * (-((2 * time - 10) ** 2) + 100)


        arc_calculation = Math.round((arc_calculation + Number.EPSILON) * 1000) / 1000
        // console.log("arc calculation:" , arc_calculation)

        // if((this.curve < 0 &&  this.arc_calculation > 0) || (this.curve > 0 && this.arc_calculation < 0) ){
        //     this.curve = 0
        // }
        // else{
        //     this.curve = arc_calculation
        // }
        
        this.curve = arc_calculation
        
        if(this.frisbee_angle < 0){
            this.curve *= -1;
        }
        if(this.current_level == 5){
            if(this.wind_direction==1){
                this.curve += ((2*( time) ** 2));
            }
            if(this.wind_direction==0){
                this.curve -= ((2*( time) ** 2));
            }
            
            this.wind_total += this.wind;
            console.log(this.wind_total)
            console.log(this.curve)
        }


    }

    // update_fribsee_angle() {
    //     if (this.frisbee_angle < 0) {
    //         this.frisbee_angle += (2 / 25);
    //         // if(this.frisbee_angle>=0){
    //         //     this.frisbee_angle = 0
    //         // }
    //     } else {
    //         this.frisbee_angle -= (2 / 25);
    //         // if(this.frisbee_angle<=0){
    //         //     this.frisbee_angle = 0
    //         // }
    //     }
    // }

    set_stage() {
        if (this.start_stage) {
            if (this.current_level == 2) {
                this.stage_targets = Array(1).fill(false)
                this.target_color = Array(1).fill(black)
                this.is_tree = [false, false]
            }

            if (this.current_level == 3) {
                this.stage_targets = Array(2).fill(false)
                this.target_color = Array(2).fill(black)
                this.is_tree = [false, false, false]
            }
            if (this.current_level == 4) {
                this.stage_targets = Array(1).fill(false)
                this.target_color = Array(1).fill(black)
                this.is_tree = [false, false, true]
            }
            if (this.current_level == 5) {
                this.stage_targets = Array(2).fill(false)
                this.target_color = Array(2).fill(black)
                this.is_tree = [false, false, false]
            }
            if (this.current_level == 6) {
                this.stage_targets = Array(1).fill(false)
                this.target_color = Array(1).fill(black)
                this.is_tree = [false, false]
            }
            console.log(this.stage_targets)
            this.start_stage = false;
        }
    }

    soft_reset() {
        if (this.reset) {
            this.reset = false;
            this.thrown = false;
            this.frisbee_angle = 0;
            this.distance = 0;
            this.throw_time = 0;
            this.frisbee_height = 13;
            this.vertical_velocity = 0;
            this.horizontal_velocity = 0;
            this.elapsed_time_prev = 0;
            this.curve = 0;
            this.frisbee_trail_transforms = [];
            this.show_trail = false;
            // this.target_color = red; //need to fix
            this.collided = false;
            this.bodies = []
            this.throwing_angle = 12;
            this.not_hit_tree = true;
            this.wind_total = 0;
            this.spin = true;
            if(this.current_level==5){
                if(Math.floor(Math.random() * (10 + 10) - 10)<0){
                    this.wind_direction=0;
                }
                else{
                    this.wind_direction=1;
                }
                this.cloud_angle = this.current_cloud_angle;
                this.cloud_rotation_angle = 0;
            }
            
        }

    }

    check_stage_completion(dt) {
        if(first_level){
            return false;
        }
        for (let i = 0; i < this.stage_targets.length; i++) {
            if (!this.stage_targets[i]){
                this.failAudio.pause();
                return false;

            }
        }

        this.completed_time += dt;
        if (this.completed_time > 2) {
            this.crowdAudio.pause();

            console.log("completed time is greater than 2")
            this.current_level++;
            if(this.current_level==7){
                this.current_level = 1
                
            }
            this.start_stage = true;
            this.reset = true;
            this.completed_time = 0;
            this.attempt_count = 0;
        }

        return true;
    }

    calculate_distance(angle, time){

        let mass = 0.175
        let gravity = 9.8
        let density_of_air_at_sea_level = 1.23
        let standard_frisbee_area = 0.0531

        //drag calculations
        let angle_of_attack = angle
        let angle_of_least_incidence = -0.0698132
        
        //drag coefficient calculation
        let form_drag = 0.08
        let induced_drag = 2.72
        let drag_coefficient = form_drag + induced_drag * (angle_of_attack - angle_of_least_incidence)**2

        //calculate lift force
        let lift_force = this.calculate_lift(this.horizontal_velocity, density_of_air_at_sea_level, standard_frisbee_area, angle)
        let gravitational_force = mass * gravity

        let vertical_force = lift_force - gravitational_force
        let vertical_acceleration = vertical_force/mass

        //account for frisbee terminal velocity
        let terminal_velocity = -Math.sqrt((2*gravitational_force)/(density_of_air_at_sea_level*drag_coefficient*standard_frisbee_area))
        
        if(this.vertical_velocity + 0.5*(vertical_acceleration * time) <= terminal_velocity){
            this.vertical_velocity = terminal_velocity
        } 
        else{
            this.vertical_velocity = this.vertical_velocity + 0.5*(vertical_acceleration * time)
        }
        
        let drag_force = this.calculate_drag(this.horizontal_velocity, density_of_air_at_sea_level, standard_frisbee_area, drag_coefficient)
        let horizontal_acceleration = -drag_force/mass
        
        this.horizontal_velocity = this.horizontal_velocity + 0.5*(horizontal_acceleration * time)
        // console.log("horizontal velocity: ", this.horizontal_velocity, "vertical velocity: ", this.vertical_velocity)
    }

    // calculate_arc(time){

    //     let process_angle = this.frisbee_angle
    //     if(this.frisbee_angle > 45){
    //         process_angle = 90 - this.frisbee_angle; 
    //         if(this.frisbee_angle < 0){
    //             process_angle = -90 - this.frisbee_angle 
    //         }
    //     }
        
    //     let curve_angle = (process_angle)/180*Math.PI
    //     curve_angle = Math.round((curve_angle + Number.EPSILON) * 1000) / 1000

    //     console.log("curve angle:" , curve_angle)
    //     console.log("frisbee angle:" , this.frisbee_angle)

    //     let arc_calculation = (Math.sin(curve_angle))*(-((2*time-10)**2)+100)

    //     arc_calculation = Math.round((arc_calculation + Number.EPSILON) * 1000) / 1000
    //     console.log("arc calculation:" , arc_calculation)

    //     // if((this.curve < 0 &&  this.arc_calculation > 0) || (this.curve > 0 && this.arc_calculation < 0) ){
    //     //     this.curve = 0
    //     // }
    //     // else{
    //     //     this.curve = arc_calculation
    //     // }

    //     this.curve = arc_calculation
        
    // }

    update_fribsee_angle(){
        if(this.frisbee_angle < 0){
            this.frisbee_angle+=(2/25);
            // if(this.frisbee_angle>=0){
            //     this.frisbee_angle = 0
            // }
        } else{
            this.frisbee_angle-=(2/25);
            // if(this.frisbee_angle<=0){
            //     this.frisbee_angle = 0
            // }
        }
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            console.log(this.initial_camera_location)
            program_state.set_camera(this.initial_camera_location);
            
            
        }



        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        this.set_stage()

        
        

        //model transform creation
        let model_transform = Mat4.identity();

        const light_position = vec4(-10, 200, -40, 1);
        // The parameters of the Light are: position, color, size
        program_state.lights = [new Light(light_position, yellow, 25000)];

        this.soft_reset()

        //control signals
        this.increase_vel();
        this.decrease_vel();

        let frisbee_transform = model_transform
        

        if (this.throw) {
            this.thrown = true;
            this.throw = false;
            this.horizontal_velocity = this.velocity * Math.cos(this.throwing_angle_rad())
            this.vertical_velocity = this.velocity * Math.sin(this.throwing_angle_rad())
            if (Math.abs(this.frisbee_angle) > 0) {
                this.horizontal_velocity = this.horizontal_velocity / (1 + 1.1 * Math.sin(Math.abs(this.frisbee_angle) * Math.PI / 180))
            }
            this.throw_time = t;
            this.frisbee_height = this.throwing_height
            this.attempt_count++;
        }
        let frisbee_scale = Mat4.scale(3, 3, 1 / 2)

        // console.log(this.throw)
        if (!this.thrown) {
            if (this.angle_left) {
                this.frisbee_angle -= 2
                if (this.frisbee_angle < -90) {
                    this.frisbee_angle = -90
                }
                this.angle_left = false
            }
            if (this.angle_right) {
                this.frisbee_angle += 2
                if (this.frisbee_angle > 90) {
                    this.frisbee_angle = 90
                }
                this.angle_right = false
            }
            this.frisbee_angle_display = this.frisbee_angle;
        }
        if (this.thrown) {
            let elapsed_time = t - this.throw_time;
            let time = elapsed_time - this.elapsed_time_prev
            this.calculate_distance(this.throwing_angle_rad(), time)

            this.distance += (this.horizontal_velocity * time)*8
            this.frisbee_height += (this.vertical_velocity * time)

            if (this.frisbee_height < 0.5) {
                this.frisbee_height = 0.5;
                this.thrown = false;
                // this.reset = true;
            }
            //calculate arc offset
            this.calculate_arc(elapsed_time)

            //calculate update angle of frisbee
            // this.throwing_angle = Math.atan(this.vertical_velocity/(this.horizontal_velocity*8))
            // console.log(this.throwing_angle*180/Math.PI)
            
            

            frisbee_transform = frisbee_transform.times(Mat4.translation(this.curve, this.frisbee_height, -this.distance))
            
            this.frisbee_camera_location = frisbee_transform;
            
            //.times(Mat4.rotation(this.distance/45*Math.PI,0,1,0))
            
            this.elapsed_time_prev = elapsed_time
            
            

            let spin = 2*Math.PI;
            if(this.spin){
                spin = 18*t
            }

            this.frisbee_trail_transforms.push(frisbee_transform.times(Mat4.scale(0.5, 0.5, 0.5)))
            frisbee_transform = frisbee_transform.times(Mat4.rotation(Math.PI / 2, 1, 0, 0)).times(Mat4.rotation(this.frisbee_angle / 180 * Math.PI, 0, 1, 0)).times(Mat4.rotation(Math.PI / 180, 0, 0, 1)).times(Mat4.rotation(spin, 0, 0, 1))
            // .times(Mat4.rotation(Math.atan(this.vertical_velocity/(this.horizontal_velocity*8)), 1, 0, 0))
        }
        else {
            // console.log(this.distance)
            
            frisbee_transform = frisbee_transform.times(Mat4.translation(this.curve, this.frisbee_height, -this.distance))
            frisbee_transform = frisbee_transform.times(Mat4.rotation(Math.PI / 2, 1, 0, 0)).times(Mat4.rotation(this.frisbee_angle / 180 * Math.PI, 0, 1, 0))
            //console.log("test")
        }

        

        frisbee_transform = frisbee_transform.times(frisbee_scale)
        this.shapes.frisbee.draw(context, program_state, frisbee_transform, this.materials.frisbee_textured);

        //draw frisbee trail
        if (this.show_trail) {
            for (let i = 0; i < this.frisbee_trail_transforms.length; i++) {
                this.shapes.sphere.draw(context, program_state, this.frisbee_trail_transforms[i], this.materials.test.override({ color: white, ambient: 1 }));
            }

        }

        //create targets
        if (this.current_level == 1) {

            //INTRO
            var levelsmsg = "Are you ready for the challenge?";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "Become the ultimate frisbee flicker.";
            document.getElementById("description").innerHTML = submsg;

            const element = document.getElementById("myBtn");

            function myFunction() {
                element.remove();
                
                first_level = false;
            }

            if(element){
                
                element.addEventListener("click", myFunction);
                
            }
           

        }

        else if (this.current_level == 2) {
            //ONE TARGET 
            var levelsmsg = "Level 1";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "Let's start with the basics. Can't be that hard right?";
            document.getElementById("description").innerHTML = submsg;

            var velmsg = "Velocity: " + this.velocity;
            document.getElementById("velocity").innerHTML = velmsg;

            var angmsg = "Angle: " + Math.floor(this.frisbee_angle);
            document.getElementById("angle").innerHTML = angmsg;

            let target_transform = model_transform.times(Mat4.translation(0, 5, -400)).times(Mat4.scale(5, 5, 1 / 2))
            this.shapes.target.draw(context, program_state, target_transform, this.materials.target_textured.override({color: this.target_color[0]}))

            let target_shadow_transform = Mat4.identity().times(Mat4.translation(0, 0, -400)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform, this.materials.shadow);

            if (this.bodies.length == 0) {
                this.bodies.push(new Body(this.shapes.frisbee, this.materials.test.override({ color: red, ambient: 1 }), vec3(3, 3, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
            }
            this.birdsAudio.play();


            this.bodies[0].emplace(frisbee_transform);
            this.bodies[1].emplace(target_transform);
            
        }

        else if (this.current_level == 3) {
            //TWO TARGETS
            var levelsmsg = "Level 2";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "Looks like your target made a new friend. Can you eliminate them both?";
            document.getElementById("description").innerHTML = submsg;

            var velmsg = "Velocity: " + this.velocity;
            document.getElementById("velocity").innerHTML = velmsg;

            var angmsg = "Angle: " + Math.floor(this.frisbee_angle);
            document.getElementById("angle").innerHTML = angmsg;

            let target_transform1 = model_transform.times(Mat4.translation(50, 10, -310)).times(Mat4.scale(5, 5, 1 / 2))
            let target_transform2 = model_transform.times(Mat4.translation(-50, 10, -310)).times(Mat4.scale(5, 5, 1 / 2))

            this.shapes.target.draw(context, program_state, target_transform1, this.materials.target_textured.override({color: this.target_color[0]}))
            this.shapes.target.draw(context, program_state, target_transform2, this.materials.target_textured.override({color: this.target_color[1]}))

            let target_shadow_transform1 = Mat4.identity().times(Mat4.translation(50, 0, -310)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            let target_shadow_transform2 = Mat4.identity().times(Mat4.translation(-50, 0, -310)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform1, this.materials.shadow);
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform2, this.materials.shadow);


            if (this.bodies.length == 0) {
                this.bodies.push(new Body(this.shapes.frisbee, this.materials.test.override({ color: red, ambient: 1 }), vec3(3, 3, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
            }

            this.bodies[0].emplace(frisbee_transform);
            this.bodies[1].emplace(target_transform1);
            this.bodies[2].emplace(target_transform2);
            this.birdsAudio.play();

        }

        if (this.current_level == 4) {
            //TREE
            var levelsmsg = "Level 3";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "AH! A tree decided to grow today. What will you do?";
            document.getElementById("description").innerHTML = submsg;

            var velmsg = "Velocity: " + this.velocity;
            document.getElementById("velocity").innerHTML = velmsg;

            var angmsg = "Angle: " + Math.floor(this.frisbee_angle);
            document.getElementById("angle").innerHTML = angmsg;

            let target_transform = model_transform.times(Mat4.translation(0, 10, -400)).times(Mat4.scale(5, 5, 1 / 2))
            let trunk_transform = model_transform.times(Mat4.translation(0, 0, -150)).times(Mat4.scale(2, 40, 2))
            let leaves_transform = trunk_transform.times(Mat4.translation(0, 0.75, 0)).times(Mat4.scale(10,0.5, 10))
            
            this.shapes.target.draw(context, program_state, target_transform, this.materials.target_textured.override({color: this.target_color[0]}))

            this.shapes.trunk.draw(context, program_state, trunk_transform, this.materials.trunk)
            this.shapes.leaves.draw(context, program_state, leaves_transform, this.materials.leaves)

            let target_shadow_transform = Mat4.identity().times(Mat4.translation(0, 0, -400)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            let tree_shadow_transform = Mat4.identity().times(Mat4.translation(0, 0, -150)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(20, 20, 3.75));
            
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform, this.materials.shadow);
            this.shapes.cylinder.draw(context, program_state, tree_shadow_transform, this.materials.shadow);

            if (this.bodies.length == 0) {
                this.bodies.push(new Body(this.shapes.frisbee, this.materials.test.override({ color: red, ambient: 1 }), vec3(3, 3, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
                this.bodies.push(new Body(this.shapes.trunk, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
            }

            this.bodies[0].emplace(frisbee_transform);
            this.bodies[1].emplace(target_transform);
            this.bodies[2].emplace(trunk_transform);
            this.birdsAudio.play();
            

        }
        else if (this.current_level == 5) {
            //TWO TARGETS WITH WIND
            var levelsmsg = "Level 4";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "BRRR It's feeling a little cold today. Do you see the wind blowing the clouds?";
            document.getElementById("description").innerHTML = submsg;

            var velmsg = "Velocity: " + this.velocity;
            document.getElementById("velocity").innerHTML = velmsg;

            var angmsg = "Angle: " + Math.floor(this.frisbee_angle);
            document.getElementById("angle").innerHTML = angmsg;

            let target_transform1 = model_transform.times(Mat4.translation(50, 10, -310)).times(Mat4.scale(5, 5, 1 / 2))
            let target_transform2 = model_transform.times(Mat4.translation(-50, 10, -310)).times(Mat4.scale(5, 5, 1 / 2))

            this.shapes.target.draw(context, program_state, target_transform1, this.materials.target_textured.override({color: this.target_color[0]}))
            this.shapes.target.draw(context, program_state, target_transform2, this.materials.target_textured.override({color: this.target_color[1]}))
            
            let target_shadow_transform1 = Mat4.identity().times(Mat4.translation(50, 0, -310)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            let target_shadow_transform2 = Mat4.identity().times(Mat4.translation(-50, 0, -310)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform1, this.materials.shadow);
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform2, this.materials.shadow);

            if (this.bodies.length == 0) {
                this.bodies.push(new Body(this.shapes.frisbee, this.materials.test.override({ color: red, ambient: 1 }), vec3(3, 3, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
            }

            this.bodies[0].emplace(frisbee_transform);
            this.bodies[1].emplace(target_transform1);
            this.bodies[2].emplace(target_transform2);;

            

        }
        else if (this.current_level == 6) {
            //MOVING TARGET
            
            var levelsmsg = "Level 5";
            document.getElementById("levels").innerHTML = levelsmsg;

            var submsg = "Catch me if you can!";
            document.getElementById("description").innerHTML = submsg;

            var velmsg = "Velocity: " + this.velocity;
            document.getElementById("velocity").innerHTML = velmsg;

            var angmsg = "Angle: " + Math.floor(this.frisbee_angle);
            document.getElementById("angle").innerHTML = angmsg;

            if(Math.abs(this.target_distance) > 30){
                this.target_direction_left = !this.target_direction_left;
            }
            this.target_distance  = 100*Math.sin(1.2*t)
            
            let target_transform = model_transform.times(Mat4.translation(this.target_distance, 10, -400)).times(Mat4.scale(5, 5, 1 / 2))
            this.shapes.target.draw(context, program_state, target_transform, this.materials.target_textured.override({color: this.target_color[0]}))
            
            let target_shadow_transform = Mat4.identity().times(Mat4.translation(this.target_distance, 0, -400)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(5, 5, 3.75));
            this.shapes.cylinder.draw(context, program_state, target_shadow_transform, this.materials.shadow);

            if (this.bodies.length == 0) {
                this.bodies.push(new Body(this.shapes.frisbee, this.materials.test.override({ color: red, ambient: 1 }), vec3(3, 3, 1 / 2)))
                this.bodies.push(new Body(this.shapes.target, this.materials.test.override({ color: red, ambient: 1 }), vec3(5, 5, 1 / 2)))
            }

            this.bodies[0].emplace(frisbee_transform);
            this.bodies[1].emplace(target_transform)
        }
        


        const points = this.collider.points
        const leeway = this.collider.leeway
        const size = vec3(1 + leeway, 1 + leeway, 1 + leeway);
        let index = 0
        for (let a of this.bodies) {

            // points.draw(context, program_state, (a.location_matrix).times(Mat4.scale(...size)), this.bright, "LINE_STRIP");
            
            for (let b of this.bodies) {
                if (a.check_if_colliding(b, this.collider)) {
                    
                    console.log(a,b)
                    console.log("collided ", index)
                    this.horizontal_velocity = 0;
                    
                    this.stage_targets[index - 1] = true;
                    if(!this.is_tree[index]){
                        this.crowdAudio.play();
                        
                    }
                    

                    this.hitAudio.play();

                    this.hittime += dt;
                    if (this.hittime>1) {
                        this.hitAudio.pause();

                    }


                    this.target_color[index-1] = forest_green;
                    this.collided = true;
                    this.spin = false;
                    // this.stage_targets[index-1] = true;
                    
                    // if(!this.is_tree[index]){
                    //     this.hitAudio.play();
                        
                    // }

                    // if(this.is_tree[index] && this.not_hit_tree){
                    //     this.failAudio.play();
                    //     this.not_hit_tree = false;
                    // }
                    
                    // console.log(this.stage_targets)
                }
                

                
            }
            index++;

        }

        this.check_stage_completion(dt);
       
        //create ground
        let ground_width = 700;
        let ground_depth = 800;
        let ground_transform = Mat4.identity().times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(ground_width, ground_depth, 1));

        this.shapes.ground.draw(context, program_state, ground_transform, this.materials.ground);

        //create sky
        let sky_height = 800;
        let sky_transform = Mat4.identity().times(Mat4.scale(ground_width, sky_height, ground_depth));

        this.shapes.sky.draw(context, program_state, sky_transform, this.materials.sky);
        
        //create clouds
        let rotation_speed = this.cloud_angle;
        if(this.wind_direction==0){
            rotation_speed += (0.01 * this.cloud_rotation_angle)
        }
        if(this.wind_direction==1){
            rotation_speed -= (0.01 * this.cloud_rotation_angle)
        }
        this.current_cloud_angle = rotation_speed;
        this.cloud_rotation_angle += dt;
        
        let layer_1_constant = 1;
        let layer_2_constant = 1.4;
        let layer_3_constant = 1.8;
        let layer_4_constant = 1.2;
        let layer_5_constant = 1.6;
        let layer_6_constant = 2;

        let cumulus1_1_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed, 0, 1, 0))
                                                .times(Mat4.translation(500, 190, 500))
                                                .times(Mat4.scale(70, 22, 19));
        let cumulus1_2_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed, 0, 1, 0))
                                                .times(Mat4.translation(500, 207, 500))
                                                .times(Mat4.scale(50, 22, 19));
        let cumulus2_1_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + Math.PI/2, 0, 1, 0))
                                                .times(Mat4.translation(500, 100, 500))
                                                .times(Mat4.scale(80, 22, 19));
        let cumulus2_2_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + Math.PI/2, 0, 1, 0))
                                                .times(Mat4.translation(500, 117, 500))
                                                .times(Mat4.scale(55, 22, 19));
        let cumulus3_1_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + Math.PI, 0, 1, 0))
                                                .times(Mat4.translation(500, 140, 500))
                                                .times(Mat4.scale(90, 22, 19));
        let cumulus3_2_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + Math.PI, 0, 1, 0))
                                                .times(Mat4.translation(500, 157, 500))
                                                .times(Mat4.scale(70, 22, 19));
        let cumulus4_1_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + (3 * Math.PI) / 2, 0, 1, 0))
                                                .times(Mat4.translation(500, 180, 500))
                                                .times(Mat4.scale(80, 22, 19));
        let cumulus4_2_transform = Mat4.identity().times(Mat4.rotation(layer_1_constant * rotation_speed + (3 * Math.PI) / 2, 0, 1, 0))
                                                .times(Mat4.translation(500, 197, 500))
                                                .times(Mat4.scale(60, 22, 19));
        let cumulus5_1_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 130, 500))
                                                .times(Mat4.scale(100, 22, 19));
        let cumulus5_2_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 147, 500))
                                                .times(Mat4.scale(75, 22, 19));
        let cumulus6_1_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + Math.PI/2 + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 210, 500))
                                                .times(Mat4.scale(76, 22, 19));
        let cumulus6_2_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + Math.PI/2 + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 227, 500))
                                                .times(Mat4.scale(55, 22, 19));
        let cumulus7_1_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + Math.PI + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 120, 500))
                                                .times(Mat4.scale(60, 22, 19));
        let cumulus7_2_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + Math.PI + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 137, 500))
                                                .times(Mat4.scale(42, 22, 19));
        let cumulus8_1_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + (3 * Math.PI) / 2 + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 220, 500))
                                                .times(Mat4.scale(80, 22, 19));
        let cumulus8_2_transform = Mat4.identity().times(Mat4.rotation(layer_2_constant * rotation_speed + (3 * Math.PI) / 2 + 0.523599, 0, 1, 0))
                                                .times(Mat4.translation(500, 237, 500))
                                                .times(Mat4.scale(62, 22, 19));
        let cumulus9_1_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 185, 500))
                                                .times(Mat4.scale(105, 22, 19));
        let cumulus9_2_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 202, 500))
                                                .times(Mat4.scale(80, 22, 19));
        let cumulus10_1_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + Math.PI/2 + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 120, 500))
                                                .times(Mat4.scale(74, 22, 19));
        let cumulus10_2_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + Math.PI/2 + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 137, 500))
                                                .times(Mat4.scale(55, 22, 19));
        let cumulus11_1_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + Math.PI + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 105, 500))
                                                .times(Mat4.scale(83, 22, 19));
        let cumulus11_2_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + Math.PI + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 122, 500))
                                                .times(Mat4.scale(60, 22, 19));
        let cumulus12_1_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + (3 * Math.PI) / 2 + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 90, 500))
                                                .times(Mat4.scale(82, 22, 19));
        let cumulus12_2_transform = Mat4.identity().times(Mat4.rotation(layer_3_constant * rotation_speed + (3 * Math.PI) / 2 + 1.0472, 0, 1, 0))
                                                .times(Mat4.translation(500, 107, 500))
                                                .times(Mat4.scale(60, 22, 19));

        let stratus1_transform = Mat4.identity().times(Mat4.rotation(layer_4_constant * rotation_speed, 0, 1, 0))
                                                .times(Mat4.translation(520, 230, 520))
                                                .times(Mat4.scale(70, 15, 20));
        let stratus2_transform = Mat4.identity().times(Mat4.rotation(layer_4_constant * rotation_speed + Math.PI/3, 0, 1, 0))
                                                .times(Mat4.translation(520, 160, 520))
                                                .times(Mat4.scale(90, 17, 20));
        let stratus3_transform = Mat4.identity().times(Mat4.rotation(layer_4_constant * rotation_speed + (2 *Math.PI)/3, 0, 1, 0))
                                                .times(Mat4.translation(520, 140, 520))
                                                .times(Mat4.scale(75, 14, 20));
        let stratus4_transform = Mat4.identity().times(Mat4.rotation(layer_4_constant * rotation_speed + Math.PI, 0, 1, 0))
                                                .times(Mat4.translation(520, 210, 520))
                                                .times(Mat4.scale(100, 19, 20));
        let stratus5_transform = Mat4.identity().times(Mat4.rotation(layer_4_constant * rotation_speed + Math.PI + Math.PI/3, 0, 1, 0))
                                                .times(Mat4.translation(520, 150, 520))
                                                .times(Mat4.scale(84, 16, 20));
        let stratus6_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + Math.PI + (2 *Math.PI)/3, 0, 1, 0))
                                                .times(Mat4.translation(520, 120, 520))
                                                .times(Mat4.scale(97, 17, 20));
        let stratus7_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 200, 520))
                                                .times(Mat4.scale(104, 20, 20));
        let stratus8_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + Math.PI/3 + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 130, 520))
                                                .times(Mat4.scale(85, 14, 20));
        let stratus9_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + (2 *Math.PI)/3 + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 110, 520))
                                                .times(Mat4.scale(70, 18, 20));
        let stratus10_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + Math.PI + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 240, 520))
                                                .times(Mat4.scale(90, 18, 20));
        let stratus11_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + Math.PI + Math.PI/3 + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 100, 520))
                                                .times(Mat4.scale(80, 15, 20));
        let stratus12_transform = Mat4.identity().times(Mat4.rotation(layer_5_constant * rotation_speed + Math.PI + (2 *Math.PI)/3 + 0.349066, 0, 1, 0))
                                                .times(Mat4.translation(520, 220, 520))
                                                .times(Mat4.scale(110, 21, 20));
        let stratus13_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 170, 520))
                                                .times(Mat4.scale(118, 22, 20));
        let stratus14_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + + Math.PI/3 + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 190, 520))
                                                .times(Mat4.scale(97, 16, 20));
        let stratus15_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + (2 *Math.PI)/3 + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 140, 520))
                                                .times(Mat4.scale(105, 19, 20));
        let stratus16_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + Math.PI + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 90, 520))
                                                .times(Mat4.scale(90, 17, 20));
        let stratus17_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + Math.PI + Math.PI/3 + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 130, 520))
                                                .times(Mat4.scale(80, 15, 20));
        let stratus18_transform = Mat4.identity().times(Mat4.rotation(layer_6_constant * rotation_speed + Math.PI + (2 *Math.PI)/3 + 0.698132, 0, 1, 0))
                                                .times(Mat4.translation(520, 190, 520))
                                                .times(Mat4.scale(96, 18, 20));

        //this.shapes.target.draw(context, program_state, test_transform,  this.materials.test.override({ color: this.target_color[0], ambient: 1 }));
        this.shapes.cloud.draw(context, program_state, stratus1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus3_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus4_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus5_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus6_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus7_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus8_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus9_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus10_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus11_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus12_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus13_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus14_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus15_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus16_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus17_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, stratus18_transform, this.materials.cloud);

        this.shapes.cloud.draw(context, program_state, cumulus1_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus1_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus2_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus2_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus3_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus3_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus4_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus4_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus5_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus5_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus6_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus6_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus7_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus7_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus8_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus8_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus9_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus9_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus10_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus10_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus11_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus11_2_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus12_1_transform, this.materials.cloud);
        this.shapes.cloud.draw(context, program_state, cumulus12_2_transform, this.materials.cloud);

        //this.cloud = Mat4.inverse(cumulus_1_transform.times(Mat4.translation(0, 0, 3)));

        //draw grass
        let grass_transform = Mat4.identity().times(Mat4.translation(0, 1, -50)).times(Mat4.scale(15, 7, 10));
        //this.shapes.grass.draw(context, program_state, grass_transform, this.materials.grass);
        
        for(var i = 5; i < 20; i += 1)
        {
            if (!(i % 3))
            {
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(Math.sin(t), 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(30, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-30, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                if (i > 10){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(60, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-60, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(90 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-90, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                }
                if (i > 11){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(120, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-120, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(150, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-150 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(180 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-180, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(210, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-210, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                }
                if (i > 12){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(240, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-240, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(270 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-270, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(300, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-300 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(330, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-330, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                }
                if (i > 15){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(360, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-360, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(390 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-390, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(420, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-420 + Math.sin(t), 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(450, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-450 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                }   
            }
            else if (!(i % 2))
            {
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(30, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-30, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                if (i > 10){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(60, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-60, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(90, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-90 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                }
                if (i > 11){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(120, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-120 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(150 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-150, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(180 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-180, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(210 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-210, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                }
                if (i > 12){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(240, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-240 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(270, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-270, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(300 , 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-300, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(330 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-330, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                }
                if (i > 15){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(360, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-360, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(390 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-390 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(420 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-420 + Math.sin(t), 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(450, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-450, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                }
            }
            else
            {
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(30, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-30, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                if (i > 10){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(60, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-60 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(90, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-90, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                }
                if (i > 11){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(120 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-120, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(150 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-150, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(180, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-180 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(210, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-210, 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                }
                if (i > 12){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(240, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-240, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(270 + Math.sin(t), 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-270, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(300 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-300, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(330, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-330 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                }
                if (i > 15){
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(360, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-360, 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(390, 1, -(1.355**i) - 1.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-390 + Math.sin(t), 1, -(1.355**i) - 3.05 * (1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(420 + Math.sin(t), 1, -(1.355**i))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-420, 1, -(1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_1);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(450, 1, -(1.355**i) - 1.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass);
                    this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.translation(-450, 1, -(1.355**i) - 3.05 * (1.355**i) + Math.sin(t))).times(Mat4.scale(15, 14, 10)), this.materials.grass_2);
                }
            }
        }

        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 + Math.sin(t), 1, -290)).times(Mat4.scale(15, 14, 10)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 + Math.sin(t), 1, -280)).times(Mat4.scale(15, 16, 10)), this.materials.grass_2);
        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 + Math.sin(t), 1, -270)).times(Mat4.scale(15, 18, 10)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 , 1, -260)).times(Mat4.scale(15, 23, 10)), this.materials.grass);
        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 + Math.sin(t), 1, -250)).times(Mat4.scale(15, 25, 10)), this.materials.grass_1);
        this.shapes.grass.draw(context, program_state, Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(200 + Math.sin(t), 1, -240)).times(Mat4.scale(15, 25, 10)), this.materials.grass_1);

        //create shadows
        //ground is at y = 0
        //frisbee is at y = ??
        let frisbee_shadow_transform = Mat4.identity().times(Mat4.translation(this.curve, 0, -this.distance)).times(Mat4.rotation(Math.PI/2,1,0,0)).times(Mat4.scale(3, 3, 2.75));
        
        // let trunk_transform = model_transform.times(Mat4.translation(0, 0, -150)).times(Mat4.scale(2, 40, 2))
        // let leaves_transform = trunk_transform.times(Mat4.translation(0, 0.75, 0)).times(Mat4.scale(10,0.5, 10))

        this.shapes.cylinder.draw(context, program_state, frisbee_shadow_transform, this.materials.shadow);
        
        this.side = Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0)).times(Mat4.translation(300, -5, 200));

        if (this.attached != undefined) {
            // Blend desired camera position with existing camera matrix (from previous frame) to smoothly pull camera towards planet 
            program_state.camera_inverse = this.attached().map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
        }
    }
}



